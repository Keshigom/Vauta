
if (WEBGL.isWebGLAvailable() === false) {

    document.body.appendChild(WEBGL.getWebGLErrorMessage());

}

// 要素を取得
var inputFile = document.getElementById("vrmInput");

// 読み込みを実行
var fileReader;
var avatarURL;

function handleFiles(filesObj) {
    //fileReader = filesObj;
    console.log("handlefile");
    console.log(filesObj[0]);
    dropbox.style.display = "none";
    avatarURL = window.URL.createObjectURL(filesObj[0]);
    main();
}

var dropbox;
dropbox = document.getElementById("dropbox");
dropbox.addEventListener("dragenter", dragenter, false);
dropbox.addEventListener("dragover", dragover, false);
dropbox.addEventListener("drop", drop, false);
function dragenter(e) {
    e.stopPropagation();
    e.preventDefault();
}

function dragover(e) {
    e.stopPropagation();
    e.preventDefault();
}
function drop(e) {
    e.stopPropagation();
    e.preventDefault();

    var dt = e.dataTransfer;
    var files = dt.files;
    handleFiles(files);
}


var container, stats, controls;
var camera, scene, renderer, light;
var isReady = false;
const clock = new THREE.Clock();



//entry point :
function main() {

    initJeeliz();
    initThree();
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
            AVATAR.errorFlag = false;
        }, //end callbackReady()

        //called at each render iteration (drawing loop)

        callbackTrack: function (detectState) {
            console.log("callback");
            console.log(detectState);
        } //end callbackTrack()
    });//end init call

}

function initThree() {

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

    AVATAR.loadVRM(scene);

    // レンダラー設定
    //renderer = new THREE.WebGLRenderer({ antialias: true });
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
    //[CHECK]
    //ボーンアニメーション機能
    //一時無効化
    //アニメーションの更新
    // let delta = clock.getDelta();
    // for (let i = 0, len = AVATAR.mixers.length; i < len; ++i) {
    //     AVATAR.mixers[i].update(delta);
    // }

    if (isReady) {
        AVATAR.UpdateExpression();
        let debugFaceData = document.getElementById("faceData");
        debugFaceData.innerHTML = AVATAR.debugMessage();
    }
    renderer.render(scene, camera);
    //console.log(JEEFACETRANSFERAPI.get_morphTargetInfluences()[6]);
    stats.update();

}
