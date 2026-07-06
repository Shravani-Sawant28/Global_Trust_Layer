//! Shared enums used across the protocol, plus their u8 <-> enum
//! conversions for storage (sol_storage! fields must be raw uint8).

use alloy_primitives::U8;

// ---------------------------------------------------------------
// JobStatus
// ---------------------------------------------------------------
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum JobStatus {
    Created = 0,
    Funded = 1,
    InProgress = 2,
    Completed = 3,
    Cancelled = 4,
}

impl From<JobStatus> for u8 {
    fn from(s: JobStatus) -> u8 {
        s as u8
    }
}

// NEW: For Stylus StorageUint<uint8>
impl From<JobStatus> for U8 {
    fn from(s: JobStatus) -> Self {
        U8::from(s as u8)
    }
}

impl TryFrom<u8> for JobStatus {
    type Error = ();

    fn try_from(v: u8) -> Result<Self, ()> {
        Ok(match v {
            0 => JobStatus::Created,
            1 => JobStatus::Funded,
            2 => JobStatus::InProgress,
            3 => JobStatus::Completed,
            4 => JobStatus::Cancelled,
            _ => return Err(()),
        })
    }
}

// ---------------------------------------------------------------
// DisputeStage
// ---------------------------------------------------------------
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum DisputeStage {
    MutualSettlement = 0,
    AiProposed = 1,
    JurorVoting = 2,
    ResolvedMutual = 3,
    ResolvedAi = 4,
    ResolvedJury = 5,
    ResolvedTimeout = 6,
}

impl From<DisputeStage> for u8 {
    fn from(s: DisputeStage) -> u8 {
        s as u8
    }
}

// NEW
impl From<DisputeStage> for U8 {
    fn from(s: DisputeStage) -> Self {
        U8::from(s as u8)
    }
}

impl TryFrom<u8> for DisputeStage {
    type Error = ();

    fn try_from(v: u8) -> Result<Self, ()> {
        Ok(match v {
            0 => DisputeStage::MutualSettlement,
            1 => DisputeStage::AiProposed,
            2 => DisputeStage::JurorVoting,
            3 => DisputeStage::ResolvedMutual,
            4 => DisputeStage::ResolvedAi,
            5 => DisputeStage::ResolvedJury,
            6 => DisputeStage::ResolvedTimeout,
            _ => return Err(()),
        })
    }
}

impl DisputeStage {
    /// Returns true if dispute has reached a terminal state.
    pub fn is_resolved(self) -> bool {
        matches!(
            self,
            DisputeStage::ResolvedMutual
                | DisputeStage::ResolvedAi
                | DisputeStage::ResolvedJury
                | DisputeStage::ResolvedTimeout
        )
    }
}

// ---------------------------------------------------------------
// JurorStatus
// ---------------------------------------------------------------
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum JurorStatus {
    Active = 0,
    Inactive = 1,
    Suspended = 2,
}

impl From<JurorStatus> for u8 {
    fn from(s: JurorStatus) -> u8 {
        s as u8
    }
}

// NEW
impl From<JurorStatus> for U8 {
    fn from(s: JurorStatus) -> Self {
        U8::from(s as u8)
    }
}

impl TryFrom<u8> for JurorStatus {
    type Error = ();

    fn try_from(v: u8) -> Result<Self, ()> {
        Ok(match v {
            0 => JurorStatus::Active,
            1 => JurorStatus::Inactive,
            2 => JurorStatus::Suspended,
            _ => return Err(()),
        })
    }
}