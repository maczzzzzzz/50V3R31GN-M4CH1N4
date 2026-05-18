{ lib, python3, ... }:

python3.pkgs.buildPythonApplication {
  pname = "sovereign-mesh-router";
  version = "0.1.0";

  src = ./.;

  propagatedBuildInputs = with python3.pkgs; [
    fastapi
    uvicorn
    httpx
  ];

  installPhase = ''
    mkdir -p $out/bin $out/lib
    cp mesh_router.py $out/lib/
    cat > $out/bin/mesh-router <<EOF
    #!/usr/bin/env python3
    import sys
    sys.path.insert(0, "$out/lib")
    from mesh_router import app
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=4000)
    EOF
    chmod +x $out/bin/mesh-router
  '';

  meta = with lib; {
    description = "Minimal native mesh router for NODESTADT Sovereign Mesh";
    license = licenses.mit;
  };
}