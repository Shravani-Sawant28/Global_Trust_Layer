/// Mirrors the dispute resolution stages from the escrow contract's DisputeStage enum.
/// Keep these numeric values in sync with whatever her contract emits.
pub struct ResolutionType;
impl ResolutionType {
    pub const MUTUAL: u8 = 0;
    pub const AI: u8 = 1;
    pub const JURY: u8 = 2;
    pub const TIMEOUT: u8 = 3;
}