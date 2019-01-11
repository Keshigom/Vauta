//three.js 設定
var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer({
    antialias: true,                //アンチエイリアス
    alpha: true,                    //透明度
    logarithmicDepthBuffer: true    //z-fighting対策、3Dモデルの服などが正しく表示されないことがあるため
});

//レンダラー設定
renderer.gammaOutput = true;                                //ガンマ補正
renderer.setClearColor(new THREE.Color("black"), 0);        //背景色
renderer.setPixelRatio(window.devicePixelRatio);            //ピクセル比
renderer.setSize(window.innerWidth, window.innerHeight);    //サイズ
renderer.domElement.style.position = "absolute";            //位置は絶対座標
renderer.domElement.style.top = "0px";                      //上端
renderer.domElement.style.left = "0px";                     //左端
document.body.appendChild(renderer.domElement);             //bodyに追加

//カメラ設定
//                                  fov,                                 aspect,zNear, zFar
camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1000, 10000);
scene.add(camera);

//光源設定
var light = new THREE.DirectionalLight(0xffffff);     // 平行光源（白）

light.position.set(0, 0, 2);// カメラ方向に配置 (CHECK)
scene.add(light);

//AR設定
//マーカ用のメディアソース設定
var source = new THREEx.ArToolkitSource({
    sourceType: "webcam",
});

source.init(function onReady() {
    // リサイズ処理
    onResize();
});

// ウィンドウサイズが変更された場合も
window.addEventListener("resize", function () {
    // リサイズ処理
    onResize();
});

// リサイズ関数
function onResize() {
    //トラッキングソースとレンダラをリサイズ
    //arControllerもリサイズする
    source.onResizeElement();
    source.copyElementSizeTo(renderer.domElement);
    if (context.arController !== null) {
        source.copyElementSizeTo(context.arController.canvas);
    }
}

//カメラパラメータ、マーカ検出設定
var context = new THREEx.ArToolkitContext({
    debug: false,                                       // デバッグ用キャンバス表示（デフォルトfalse）
    cameraParametersUrl: "assets/markers/camera_para.dat",             // カメラパラメータファイル
    detectionMode: "mono",                              // 検出モード（color/color_and_matrix/mono/mono_and_matrix）
    imageSmoothingEnabled: true,                        // 画像をスムージングするか（デフォルトfalse）
    maxDetectionRate: 60,                               // マーカの検出レート（デフォルト60）
    canvasWidth: source.parameters.sourceWidth,         // マーカ検出用画像の幅（デフォルト640）
    canvasHeight: source.parameters.sourceHeight,       // マーカ検出用画像の高さ（デフォルト480）
});
context.init(function onCompleted() {                  // コンテクスト初期化が完了したら
    camera.projectionMatrix.copy(context.getProjectionMatrix());   // 射影行列をコピー
});



//---------------------------------------------------------------------
//シーン構成
//---------------------------------------------------------------------

//アニメーション用設定
const clock = new THREE.Clock();
let mixers = new Array();


initScene();
function initScene() {

    //マーカーを登録
    var marker1 = new THREE.Group();
    var controls = new THREEx.ArMarkerControls(context, marker1, {
        type: "pattern",
        patternUrl: "assets/markers/qr.patt",
    });

    //シーンにマーカーを追加
    scene.add(marker1);
    //このmarker1にモデルを追加していく

    // モデル1（富士山）
    // THREE.CylinderGeometry(topRadius, buttomRadius, height, segmentsRadius, segmentsHeight, openEnded)
    //　大きさに注意,高さ10だと大きすぎる
    var geometry = new THREE.CylinderGeometry(0.1, 0.5, 1, 16, 16, true);

    const textureLoader = new THREE.TextureLoader();
    const textureFuji = textureLoader.load("assets/textures/fuji.jpg");

    var materia1 = new THREE.MeshBasicMaterial({
        map: textureFuji
    });

    //メッシュの生成
    //グローバル変数
    meshFuji = new THREE.Mesh(geometry, materia1);
    meshFuji.overdraw = true; //CHECK
    meshFuji.name = "fuji";
    meshFuji.position.set(0, 0.5, -1);
    marker1.add(meshFuji);

    //頂上部分
    geometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 16, 16, false);
    materia1 = new THREE.MeshBasicMaterial(
        { color: 0xFFFFFF }
    );
    var meshFujiTop = new THREE.Mesh(geometry, materia1);
    meshFujiTop.position.set(0, 0.5, -1);
    marker1.add(meshFujiTop);

    //モデル２　メッセージ
    const textureMessage = textureLoader.load("assets/textures/message.png");
    var mat = new THREE.MeshBasicMaterial({
        map: textureMessage
    });
    geometry = new THREE.PlaneGeometry(1, 1);
    const plane = new THREE.Mesh(geometry, mat);
    plane.overdraw = true; //CHECK
    plane.position.set(0, 0.3, 0.7);
    plane.rotation.set(-Math.PI / 2, 0, 0);
    marker1.add(plane);



    //モデル3　VRM

    //アニメーション読み込み
    //別のGLTFモデルから流用
    //モーション元はmixamo
    const animationFiles = ['assets/motions/wave.gltf'];
    const animationLoader = new THREE.GLTFLoader();
    for (let i = 0; i < animationFiles.length; ++i) {
        animationLoader.load(animationFiles[i], function () { console.log('Animation ' + i + ' loaded.') });
    }

    let loadModelIndex = 0;
    let loadAnimationIndex = 0;
    var loader = new THREE.VRMLoader();

    loader.load('assets/models/Vim.vrm', function (vrm) {

        vrm.scene.name = "Vim";
        vrm.scene.traverse(function (object) {

            if (object.material) {

                if (Array.isArray(object.material)) {

                    for (var i = 0, il = object.material.length; i < il; i++) {

                        let material = new THREE.MeshBasicMaterial();
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

                    let material = new THREE.MeshBasicMaterial();
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

        //Vroidモデル用
        //表情のブレンドシェイプ
        let morphTarget = vrm.scene.getObjectByName("Face", true);
        //口角
        morphTarget.morphTargetInfluences[1] = 0;

        vrm.scene.position.set(0, 0, 0);
        vrm.scene.scale.set(1, 1, 1);
        vrm.scene.rotation.set(0, Math.PI, 0);
        marker1.add(vrm.scene);

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
        mixers.push(mixer);

    });

}

//---------------------------------------------------------------------
//　Tween アニメーション
//---------------------------------------------------------------------

// meshFuji 
var twIni1 = { posZ: 0, rotY: 0 };                      // 初期パラメータ
var twVal1 = { posZ: 0, rotY: 0 };                      // tweenによって更新されるパラメータ
var twFor1 = { posZ: 0, rotY: 4 * Math.PI };              // ターゲットパラメータ
// 「行き」のアニメーション
function tween1() {
    var tween = new TWEEN.Tween(twVal1)                 // tweenオブジェクトを作成
        .to(twFor1, 2000)                                   // ターゲットと到達時間
        .easing(TWEEN.Easing.Back.Out)                      // イージング
        .onUpdate(function () {                              // フレーム更新時の処理
            meshFuji.rotation.y = twVal1.rotY;                   // 回転を変更
        })
        .onComplete(function () {                            // アニメーション完了時の処理
            tween1_back();                                    // 「帰り」のアニメーションを実行
        })
        .delay(0)                                           // 開始までの遅延時間
        .start();                                           // tweenアニメーション開始
}
// 「帰り」のアニメーション    
function tween1_back() {
    var tween = new TWEEN.Tween(twVal1)
        .to(twIni1, 2000)                                   // ターゲットを初期パラメータに設定
        .easing(TWEEN.Easing.Back.InOut)
        .onUpdate(function () {
            meshFuji.rotation.y = twVal1.rotY;
        })
        .onComplete(function () {
            // なにもしない
        })
        .delay(100)
        .start();
}

//===================================================================
// クリックイベント
//===================================================================
window.addEventListener("mousedown", function (ret) {
    var mouseX = ret.clientX;                           // マウスのx座標
    var mouseY = ret.clientY;                           // マウスのy座標
    mouseX = (mouseX / window.innerWidth) * 2 - 1;    // -1 ～ +1 に正規化されたx座標
    mouseY = -(mouseY / window.innerHeight) * 2 + 1;    // -1 ～ +1 に正規化されたy座標
    var pos = new THREE.Vector3(mouseX, mouseY, 1);     // マウスベクトル
    pos.unproject(camera);                              // スクリーン座標系をカメラ座標系に変換
    // レイキャスタを作成（始点, 向きのベクトル）
    var ray = new THREE.Raycaster(camera.position, pos.sub(camera.position).normalize());
    var obj = ray.intersectObjects(scene.children, true);   // レイと交差したオブジェクトの取得
    if (obj.length > 0) {                                // 交差したオブジェクトがあれば
        picked(obj[0].object.name);                       // ピックされた対象に応じた処理を実行
    }
});
// ピックされた対象に応じた処理
function picked(objName) {
    switch (objName) {
        case "fuji":
            tween1();
            break;
        default:
            break;
    }
}

//---------------------------------------------------------------------
//　描画
//---------------------------------------------------------------------

//描画関数
function renderScene() {
    //ブラウザの描画更新ごとに呼び出される
    requestAnimationFrame(renderScene);
    //アニメーションの更新
    let delta = clock.getDelta();
    for (let i = 0, len = mixers.length; i < len; ++i) {
        mixers[i].update(delta);
    }

    if (source.ready === false) { return; }             // メディアソースの準備ができていなければ抜ける
    context.update(source.domElement);                  // ARToolkitのコンテキストを更新
    TWEEN.update();                                     // Tweenアニメーションを更新
    renderer.render(scene, camera);                     // レンダリング実施

}
renderScene();