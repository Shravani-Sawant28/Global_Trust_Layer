#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;

pub mod constants;
pub mod errors;
pub mod events;
pub mod 
types;
pub mod storage;
pub mod access;
pub mod client;
pub mod freelancer;
pub mod juror;

use alloc::string::String;
use stylus_sdk::{
    alloy_primitives::{Address, U256},
    prelude::*,
};

use crate::constants::*;
use crate::errors::*;
use crate::events::*;
use crate::types::ResolutionType;
use crate::storage::{ClientPassport, FreelancerPassport, JurorPassport};

sol_storage! {
    #[entrypoint]
    pub struct ReputationRegistry {
        address owner;
        address escrow_factory;
        mapping(address => ClientPassport) client_passports;
        mapping(address => FreelancerPassport) freelancer_passports;
        mapping(address => JurorPassport) juror_passports;
    }
}

#[public]
impl ReputationRegistry {
    /// Run once, manually, right after deployment.
    pub fn init(&mut self) {
        if self.owner.get() == Address::ZERO {
            self.owner.set(self.vm().msg_sender());
        }
    }

    pub fn set_escrow_factory(&mut self, escrow: Address) -> Result<(), ReputationError> {
        if self.vm().msg_sender() != self.owner.get() {
            return Err(ReputationError::OnlyOwner(OnlyOwner {}));
        }
        if escrow == Address::ZERO {
            return Err(ReputationError::InvalidAddress(InvalidAddress {}));
        }
        if self.escrow_factory.get() != Address::ZERO {
            return Err(ReputationError::AlreadySet(AlreadySet {}));
        }
        self.escrow_factory.set(escrow);
        self.vm().log(EscrowFactorySet { escrowFactory: escrow });
        Ok(())
    }

    // ─────────────────────── HAPPY PATH ───────────────────────

    pub fn record_job_completed(
        &mut self,
        client_addr: Address,
        freelancer_addr: Address,
        amount: U256,
    ) -> Result<(), ReputationError> {
        access::require_escrow(self.escrow_factory.get(), self.vm().msg_sender())?;

        self.init_client(client_addr);
        self.init_freelancer(freelancer_addr);

        let client_new_score;
        {
            let ts = U256::from(self.vm().block_timestamp());
            let mut c = self.client_passports.setter(client_addr);
            let v = c.jobs_completed.get(); c.jobs_completed.set(v + U256::from(1));
            let v = c.total_volume.get(); c.total_volume.set(v + amount);
            let new_score = client::score_after_completion(c.trust_score.get());
            c.trust_score.set(new_score);
            c.last_updated.set(ts);
            client_new_score = new_score;
        }
        self.vm().log(ScoreIncreased {
            wallet: client_addr, points: U256::from(COMPLETION_REWARD),
            newScore: client_new_score,
            reason: String::from("job completed"),
        });

        let freelancer_new_score;
        {
            let ts = U256::from(self.vm().block_timestamp());
            let mut f = self.freelancer_passports.setter(freelancer_addr);
            let v = f.jobs_completed.get(); f.jobs_completed.set(v + U256::from(1));
            let v = f.on_time_deliveries.get(); f.on_time_deliveries.set(v + U256::from(1));
            let v = f.total_volume.get(); f.total_volume.set(v + amount);
            let new_score = freelancer::score_after_completion(f.trust_score.get());
            f.trust_score.set(new_score);
            f.last_updated.set(ts);
            freelancer_new_score = new_score;
        }
        self.vm().log(ScoreIncreased {
            wallet: freelancer_addr, points: U256::from(COMPLETION_REWARD),
            newScore: freelancer_new_score,
            reason: String::from("job completed"),
        });

        Ok(())
    }

    pub fn record_late_delivery(&mut self, freelancer_addr: Address) -> Result<(), ReputationError> {
        access::require_escrow(self.escrow_factory.get(), self.vm().msg_sender())?;
        self.init_freelancer(freelancer_addr);

        let ts = U256::from(self.vm().block_timestamp());
        let mut f = self.freelancer_passports.setter(freelancer_addr);
        let v = f.late_deliveries.get(); f.late_deliveries.set(v + U256::from(1));
        let new_score = freelancer::score_after_late_delivery(f.trust_score.get());
        f.trust_score.set(new_score);
        f.last_updated.set(ts);
        Ok(())
    }

    pub fn record_ghosting(&mut self, freelancer_addr: Address) -> Result<(), ReputationError> {
        access::require_escrow(self.escrow_factory.get(), self.vm().msg_sender())?;
        self.init_freelancer(freelancer_addr);

        let ts = U256::from(self.vm().block_timestamp());
        let mut f = self.freelancer_passports.setter(freelancer_addr);
        let v = f.ghosting_count.get(); f.ghosting_count.set(v + U256::from(1));
        let new_score = freelancer::score_after_ghosting(f.trust_score.get());
        f.trust_score.set(new_score);
        f.last_updated.set(ts);
        Ok(())
    }

    // ─────────────────────── DISPUTES ───────────────────────

    pub fn record_dispute_raised(
        &mut self,
        client_addr: Address,
        freelancer_addr: Address,
    ) -> Result<(), ReputationError> {
        access::require_escrow(self.escrow_factory.get(), self.vm().msg_sender())?;
        self.init_client(client_addr);
        self.init_freelancer(freelancer_addr);

        {
            let mut c = self.client_passports.setter(client_addr);
            let v = c.disputes_involved.get(); c.disputes_involved.set(v + U256::from(1));
        }
        {
            let mut f = self.freelancer_passports.setter(freelancer_addr);
            let v = f.disputes_involved.get(); f.disputes_involved.set(v + U256::from(1));
        }
        Ok(())
    }

    /// Called once per resolved dispute, regardless of whether it was Mutual / AI / Jury / Timeout.
    /// client_bps is the final agreed/decided share going to the client (0-10000).
    /// resolution_type must match crate::types::ResolutionType constants.
    pub fn record_dispute_resolved(
        &mut self,
        client_addr: Address,
        freelancer_addr: Address,
        client_bps: U256,
        resolution_type: u8,
    ) -> Result<(), ReputationError> {
        access::require_escrow(self.escrow_factory.get(), self.vm().msg_sender())?;
        if resolution_type > ResolutionType::TIMEOUT {
            return Err(ReputationError::InvalidResolutionType(InvalidResolutionType {}));
        }
        self.init_client(client_addr);
        self.init_freelancer(freelancer_addr);

        // Timeout = 50/50 by definition in her contract — nobody is "at fault", skip penalties.
        if resolution_type == ResolutionType::TIMEOUT {
            return Ok(());
        }

        if freelancer::freelancer_was_at_fault(client_bps) {
            let ts = U256::from(self.vm().block_timestamp());
            let mut f = self.freelancer_passports.setter(freelancer_addr);
            let v = f.disputes_lost.get(); f.disputes_lost.set(v + U256::from(1));
            let new_score = freelancer::score_after_dispute_loss(f.trust_score.get());
            f.trust_score.set(new_score);
            f.last_updated.set(ts);
        } else if freelancer::client_was_at_fault(client_bps) {
            let ts = U256::from(self.vm().block_timestamp());
            let mut c = self.client_passports.setter(client_addr);
            let v = c.disputes_lost.get(); c.disputes_lost.set(v + U256::from(1));
            let new_score = client::score_after_dispute_loss(c.trust_score.get());
            c.trust_score.set(new_score);
            c.last_updated.set(ts);
        }
        // Anything between the two thresholds = genuine 50/50-ish split, nobody penalized.

        Ok(())
    }

    // ─────────────────────── JURORS ───────────────────────

    /// Called once per juror after finalize_jury() determines the majority outcome.
    pub fn record_juror_vote(&mut self, juror_addr: Address, was_correct: bool) -> Result<(), ReputationError> {
        access::require_escrow(self.escrow_factory.get(), self.vm().msg_sender())?;
        self.init_juror(juror_addr);

        let ts = U256::from(self.vm().block_timestamp());
        {
            let mut j = self.juror_passports.setter(juror_addr);
            let v = j.cases_handled.get(); j.cases_handled.set(v + U256::from(1));

            if was_correct {
                let v = j.correct_votes.get(); j.correct_votes.set(v + U256::from(1));
                let new_score = juror::score_after_correct_vote(j.trust_score.get());
                j.trust_score.set(new_score);
            } else {
                let v = j.wrong_votes.get(); j.wrong_votes.set(v + U256::from(1));
                let new_score = juror::score_after_wrong_vote(j.trust_score.get());
                j.trust_score.set(new_score);
            }
            j.last_updated.set(ts);
        } // drop j before logging

        self.vm().log(JurorVoteRecorded { juror: juror_addr, wasCorrect: was_correct });
        Ok(())
    }

    // ─────────────────────── VIEWS ───────────────────────

    pub fn get_client_score(&self, wallet: Address) -> U256 {
        self.client_passports.get(wallet).trust_score.get()
    }

    pub fn get_freelancer_score(&self, wallet: Address) -> U256 {
        self.freelancer_passports.get(wallet).trust_score.get()
    }

    pub fn get_juror_score(&self, wallet: Address) -> U256 {
        self.juror_passports.get(wallet).trust_score.get()
    }

    pub fn get_client_passport(&self, wallet: Address) -> (U256, U256, U256, U256, U256) {
        let p = self.client_passports.get(wallet);
        (p.trust_score.get(), p.jobs_completed.get(), p.disputes_involved.get(),
         p.disputes_lost.get(), p.total_volume.get())
    }

    pub fn get_freelancer_passport(&self, wallet: Address) -> (U256, U256, U256, U256, U256, U256, U256) {
        let p = self.freelancer_passports.get(wallet);
        (p.trust_score.get(), p.jobs_completed.get(), p.on_time_deliveries.get(),
         p.late_deliveries.get(), p.disputes_lost.get(), p.ghosting_count.get(), p.total_volume.get())
    }

    pub fn get_juror_passport(&self, wallet: Address) -> (U256, U256, U256, U256) {
        let p = self.juror_passports.get(wallet);
        (p.trust_score.get(), p.cases_handled.get(), p.correct_votes.get(), p.wrong_votes.get())
    }
}

impl ReputationRegistry {
    fn init_client(&mut self, wallet: Address) {
        if self.client_passports.get(wallet).member_since.get().is_zero() {
            let ts = U256::from(self.vm().block_timestamp());
            {
                let mut c = self.client_passports.setter(wallet);
                c.trust_score.set(U256::from(STARTING_SCORE));
                c.member_since.set(ts);
            } // drop mutable borrow before logging
            self.vm().log(PassportCreated { wallet, timestamp: ts });
        }
    }

    fn init_freelancer(&mut self, wallet: Address) {
        if self.freelancer_passports.get(wallet).member_since.get().is_zero() {
            let ts = U256::from(self.vm().block_timestamp());
            {
                let mut f = self.freelancer_passports.setter(wallet);
                f.trust_score.set(U256::from(STARTING_SCORE));
                f.member_since.set(ts);
            } // drop mutable borrow before logging
            self.vm().log(PassportCreated { wallet, timestamp: ts });
        }
    }

    fn init_juror(&mut self, wallet: Address) {
        if self.juror_passports.get(wallet).member_since.get().is_zero() {
            let ts = U256::from(self.vm().block_timestamp());
            let mut j = self.juror_passports.setter(wallet);
            j.trust_score.set(U256::from(STARTING_SCORE));
            j.member_since.set(ts);
        }
    }
}