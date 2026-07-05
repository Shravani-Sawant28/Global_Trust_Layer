#[cfg(feature = "export-abi")]
fn main() {
    gtl_escrow::print_from_args();
}

#[cfg(not(feature = "export-abi"))]
fn main() {}