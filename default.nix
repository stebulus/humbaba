let nixpkgs = import <nixpkgs> {};
in import ./humbaba.nix {
  inherit (nixpkgs) nodejs;
  inherit (nixpkgs) stdenv;
}
