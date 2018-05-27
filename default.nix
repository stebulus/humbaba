let nixpkgs = import <nixpkgs> {};
in import ./humbaba.nix {
  nodejs = nixpkgs.nodejs-8_x;
  inherit (nixpkgs) stdenv;
}
