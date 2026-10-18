import * as THREE from 'three';

export function createSimulatorScene(scene) {
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    let bboxMode = 0; 
    let sphereMode = 0;

    // Geometries & Materials
    const bboxGeo  = new THREE.BoxGeometry(1, 1, 1);
    const bboxMatW = new THREE.MeshBasicMaterial({ color: 0xffaaff, wireframe: true, transparent: true, opacity: 0.4 });
    const bboxMatT = new THREE.MeshBasicMaterial({ color: 0xffaaff, wireframe: false, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false });
    
    const bboxMesh = new THREE.Mesh(bboxGeo, bboxMatW);
    worldGroup.add(bboxMesh);

    const sphereGeo  = new THREE.SphereGeometry(1, 32, 16);
    const sphereMat  = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true, transparent: true, opacity: 0.10, depthWrite: false });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    worldGroup.add(sphereMesh);

    const t0Geo = new THREE.SphereGeometry(0.2, 32, 16);
    const t0Mat = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: false, transparent: false, opacity: 0.60 })
    const t0    = new THREE.Mesh(t0Geo, t0Mat);
    worldGroup.add(t0);

    const t1Geo = new THREE.SphereGeometry(0.2, 32, 16);
    const t1Mat = new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: false, transparent: false, opacity: 0.60 })
    const t1    = new THREE.Mesh(t1Geo, t1Mat);
    worldGroup.add(t1);

    let x0, x1, y0, y1, z0, z1;

    const centerArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 1, 0xff3333, 0.2, 0.1);
    const rayArrow    = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 1, 0xff9999, 0.2, 0.1);
    const radiusArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 1, 0x449999, 0.2, 0.1);
    const pointABox   = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 1, 0xff33ff, 0.2, 0.1);
    const pointBBox   = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 1, 0xff3333, 0.2, 0.1);
    worldGroup.add(centerArrow);
    worldGroup.add(rayArrow);
    worldGroup.add(radiusArrow);
    worldGroup.add(pointABox);
    worldGroup.add(pointBBox);

    function intersectRayAABB(rayOrigin, rayDir, boxMin, boxMax) {
        let tMin = -Infinity;
        let tMax = Infinity;

        if (Math.abs(rayDir.x) < 0.00001) {
            if (rayOrigin.x < boxMin.x || rayOrigin.x > boxMax.x) return null;
        } else {
            let invDir = 1.0 / rayDir.x;
            let t1 = (boxMin.x - rayOrigin.x) * invDir;
            let t2 = (boxMax.x - rayOrigin.x) * invDir;
            if (t1 > t2) { let temp = t1; t1 = t2; t2 = temp; }
            tMin = Math.max(tMin, t1);
            tMax = Math.min(tMax, t2);
            if (tMin > tMax) return null;
        }

        if (Math.abs(rayDir.y) < 0.00001) {
            if (rayOrigin.y < boxMin.y || rayOrigin.y > boxMax.y) return null;
        } else {
            let invDir = 1.0 / rayDir.y;
            let t1 = (boxMin.y - rayOrigin.y) * invDir;
            let t2 = (boxMax.y - rayOrigin.y) * invDir;
            if (t1 > t2) { let temp = t1; t1 = t2; t2 = temp; }
            tMin = Math.max(tMin, t1);
            tMax = Math.min(tMax, t2);
            if (tMin > tMax) return null;
        }
       
        if (Math.abs(rayDir.z) < 0.00001) {
            if (rayOrigin.z < boxMin.z || rayOrigin.z > boxMax.z) return null;
        } else {
            let invDir = 1.0 / rayDir.z;
            let t1 = (boxMin.z - rayOrigin.z) * invDir;
            let t2 = (boxMax.z - rayOrigin.z) * invDir;
            if (t1 > t2) { let temp = t1; t1 = t2; t2 = temp; }
            tMin = Math.max(tMin, t1);
            tMax = Math.min(tMax, t2);
            if (tMin > tMax) return null;
        }

        if (tMax < 0) return null;

        return { tMin, tMax };
    }

    function genTriangle(p0, p1, p2) {
        const vertices = new Float32Array([
            p0.x, p0.y, p0.z,
            p1.x, p1.y, p1.z,
            p2.x, p2.y, p2.y
        ]);

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.computeVertexNormals();

        const material = new THREE.MeshBasicMaterial({ color: 0x555555, side: THREE.DoubleSide });
        const triangleMesh = new THREE.Mesh(geometry, material);

        return triangleMesh;
    }

    function update(radius, sxPos, syPos, szPos) {
        const currentSpherePosition = new THREE.Vector3(sxPos, syPos, szPos);
        const sphereCenterDirVec = currentSpherePosition.clone().normalize();
        const diameter = radius * 2;

        bboxMesh.position.copy(currentSpherePosition);
        bboxMesh.scale.set(diameter, diameter, diameter);

        sphereMesh.position.copy(currentSpherePosition);
        sphereMesh.scale.set(radius, radius, radius);

        const centerDistance = currentSpherePosition.length();
        if (centerDistance > 0.0001) {
            centerArrow.position.set(0, 0, 0);
            centerArrow.setDirection(sphereCenterDirVec);
            centerArrow.setLength(centerDistance, 0.2, 0.1);
        }

        const pointA = new THREE.Vector3(sxPos - radius, syPos - radius, szPos - radius);
        const pADist = pointA.length();
        if (pADist > 0.0001) {
            pointABox.setDirection(pointA.clone().normalize());
            pointABox.setLength(pADist, 0.2, 0.1);
        }

        const pointB = new THREE.Vector3(sxPos + radius, syPos + radius, szPos + radius);
        const pBDist = pointB.length();
        if (pBDist > 0.0001) {
            pointBBox.setDirection(pointB.clone().normalize());
            pointBBox.setLength(pBDist, 0.2, 0.1);
        }

        const radiusOrigin  = new THREE.Vector3(0, 0, 0);
        const radiusDir     = new THREE.Vector3(radius, radius, radius);
        const radiusVLength = radiusDir.length();

        radiusArrow.position.copy(radiusOrigin);
        radiusArrow.setDirection(radiusDir.clone().normalize());
        radiusArrow.setLength(radiusVLength, 0.2, 0.1);

        const rayOrigin = new THREE.Vector3(0, 0, 0);
        const rayDir    = sphereCenterDirVec;
        const rayLength = currentSpherePosition.length() + 7;

        rayArrow.position.copy(rayOrigin);
        rayArrow.setDirection(rayDir);
        rayArrow.setLength(rayLength, 0.2, 0.1);

        const hit = intersectRayAABB(rayOrigin, rayDir, pointA, pointB);

        if (hit) {
            const entryPoint = rayOrigin.clone().addScaledVector(rayDir, hit.tMin);
            const exitPoint  = rayOrigin.clone().addScaledVector(rayDir, hit.tMax);

            t0.visible = true;
            t1.visible = true;
            t0.position.copy(entryPoint);
            t1.position.copy(exitPoint);
        } else {
            t0.visible = false;
            t1.visible = false;
        }

        return { currentSpherePosition, pointA, pointB, hit };
    }

    function toggleBBoxMaterial() {
        bboxMode = (bboxMode + 1) % 2;
        if (bboxMode === 0) {
            bboxMesh.material = bboxMatW;
            return "Wireframe mode: ON";
        } else {
            bboxMesh.material = bboxMatT;
            return "Wireframe mode: OFF";
        }
    }

    function toggleSphereMaterial() {
        sphereMode = (sphereMode + 1) % 2;
        if (sphereMode === 0) {
            sphereMesh.visible = true;
            return "Sphere Visible: TRUE"
        } else {
            sphereMesh.visible = false;
            return "Sphere Visible: FALSE"
        }
    }

    return { update, toggleBBoxMaterial, toggleSphereMaterial };
}
