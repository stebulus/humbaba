{ nodejs, stdenv }:
stdenv.mkDerivation {
  name = "humbaba";
  src = ./.;
  buildInputs = [ nodejs ];
}
