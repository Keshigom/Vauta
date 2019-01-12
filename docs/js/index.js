if (WEBGL.isWebGLAvailable() === false) {

    document.body.appendChild(WEBGL.getWebGLErrorMessage());

}

var container, stats, controls;
var camera, scene, renderer, light;
var isReady = false;
const clock = new THREE.Clock();



//entry point :
function main() {
    // const videoElement = document.getElementById('trackVideo');

    //if (videoElement['currentTime'] && videoElement['videoWidth'] && videoElement['videoHeight']) {
    //initJeeliz(videoElement);
    //} else {
    //   setTimeout(main, 100);
    //   videoElement['play']();
    //}
    initJeeliz();
    animate();
}
//function initJeeliz(videoElement) {
function initJeeliz() {
    //jeeliz init
    JEEFACETRANSFERAPI.init({
        canvasId: 'jeefacetransferCanvas',
        NNCpath: '../lib/jeeliz/', //path to JSON neural network model (NNC.json by default)
        // videoSettings: {
        //     videoElement: videoElement
        // },
        callbackReady: function (errCode, spec) {
            if (errCode) {
                console.log('AN ERROR HAPPENS. ERROR CODE =', errCode);
                return;
            }
            // [init scene with spec...]
            console.log('INFO: JEEFACEFILTERAPI IS READY');
            isReady = true;
        }, //end callbackReady()

        //called at each render iteration (drawing loop)
        
        callbackTrack: function (detectState) {
            console.log("callback");
            console.log(detectState);
        } //end callbackTrack()
    });//end init call

}

initThree();
function initThree() {

    //animation
    const animationFiles = ['assets/motion/Idle.gltf'];
    const animationLoader = new THREE.GLTFLoader();
    for (let i = 0; i < animationFiles.length; ++i) {
        animationLoader.load(animationFiles[i], function () { });
    }


    let loadModelIndex = 0;
    let loadAnimationIndex = 0;

    container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
    camera.position.set(0, 1.5, - 1);

    controls = new THREE.OrbitControls(camera);
    controls.target.set(0, 1.5, 0);
    controls.update();

    scene = new THREE.Scene();

    light = new THREE.HemisphereLight(0xbbbbff, 0x444422);
    light.position.set(0, 1, 0);
    scene.add(light);

    // model
    var loader = new THREE.VRMLoader();
    //			loader.load('models/vrm/Alicia/AliciaSolid.vrm', function (vrm) {
    loader.load('assets/model/Mono.vrm', function (vrm) {

        vrm.scene.name = "VRM";

        // VRMLoader doesn't support VRM Unlit extension yet so
        // converting all materials to MeshBasicMaterial here as workaround so far.
        vrm.scene.traverse(function (object) {

            if (object.material) {

                if (Array.isArray(object.material)) {

                    for (var i = 0, il = object.material.length; i < il; i++) {

                        var material = new THREE.MeshBasicMaterial();
                        THREE.Material.prototype.copy.call(material, object.material[i]);
                        material.color.copy(object.material[i].color);
                        material.map = object.material[i].map;
                        material.lights = false;
                        material.skinning = object.material[i].skinning;
                        material.morphTargets = object.material[i].morphTargets;
                        material.morphNormals = object.material[i].morphNormals;
                        object.material[i] = material;

                    }

                } else {

                    var material = new THREE.MeshBasicMaterial();
                    THREE.Material.prototype.copy.call(material, object.material);
                    material.color.copy(object.material.color);
                    material.map = object.material.map;
                    material.lights = false;
                    material.skinning = object.material.skinning;
                    material.morphTargets = object.material.morphTargets;
                    material.morphNormals = object.material.morphNormals;
                    object.material = material;

                }

            }

        });

        //Vroid Only
        //表情のブレンドシェイプ
        AVATAR.morphTarget = vrm.scene.getObjectByName("Face", true);


        scene.add(vrm.scene);

        //アニメーションの紐付け
        let mixer = new THREE.AnimationMixer(vrm.scene);
        animationLoader.load(animationFiles[loadAnimationIndex], function (gltf) {
            const animations = gltf.animations;
            if (animations && animations.length) {
                for (let animation of animations) {
                    correctBoneName(animation.tracks);
                    correctCoordinate(animation.tracks);
                    mixer.clipAction(animation).play();
                }
            }
        });
        AVATAR.mixers.push(mixer);
        AVATAR.neck = vrm.scene.children[3].skeleton.bones[12];
        AVATAR.head = vrm.scene.children[3].skeleton.bones[13];
        //vrm.scene.children[3].skeleton.bones[12].rotation.z = 1;
    });

    //    renderer = new THREE.WebGLRenderer({ antialias: true });
    //renderer.setPixelRatio(window.devicePixelRatio);
    renderer = new THREE.WebGLRenderer({});
    renderer.setPixelRatio(1);

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.gammaOutput = true;
    container.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);

    // stats
    stats = new Stats();
    container.appendChild(stats.dom);

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {

    requestAnimationFrame(animate);
    //アニメーションの更新
    let delta = clock.getDelta();
    for (let i = 0, len = AVATAR.mixers.length; i < len; ++i) {
        AVATAR.mixers[i].update(delta);
    }
    if (isReady) {
        AVATAR.UpdateExpression();
        let debugFaceData = document.getElementById("faceData");
        debugFaceData.innerHTML = AVATAR.debugMessage();
    }
    renderer.render(scene, camera);
    //console.log(JEEFACETRANSFERAPI.get_morphTargetInfluences()[6]);
    stats.update();

}

