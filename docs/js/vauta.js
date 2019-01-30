const TargetCanvas = `threeCanvas`;
var VAUTA = VAUTA || {};
(function (global) {
    // 設定項目
    // settings[type][key] 
    let settings = {
        "isMirror": true,       //鏡のように動作させる（右目を閉じるとアバターは左目を閉じる）
        "isDebug": false,
        "isAnitalias": false,
        "offThreshold": {},     //無変化の閾値
        "onThreshold": {},      //最大変化の閾値
        "headOffset": {         //顔の向きが中心になるように調整する
            "x": 0,
            "y": 0,
            "z": 0,              //y,z は非推奨
        }
    };

    // 初期化
    VAUTA.init = (targetCanvas, avatarURL) => {
        initThree(targetCanvas);
        initStats();
        //TODO:消す
        addTestObject();
        //VAUTA.loadModel(`../asset/MonoPub.vrm`);
        VAUTA.loadModel(avatarURL);
        initfaceFilter();
        //描画開始
        VAUTA.update();
    }

    //ファイルを読み込む
    //TODO:複数ファイルに対応する(テクスチャなど)
    VAUTA.handleFiles = (filesObj) => {
        document.getElementById("loadSpinner").classList.add("is-active");
        dropbox.style.display = "none";
        const avatarURL = window.URL.createObjectURL(filesObj[0]);
        VAUTA.init(document.getElementById(TargetCanvas), avatarURL);
    }

    let stats, controls;
    let camera, scene, renderer;
    const initThree = (canvas) => {

        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
        camera.position.set(0, 1.5, - 1);

        controls = new THREE.OrbitControls(camera, canvas);
        controls.target.set(0, 1.5, 0);
        controls.update();

        scene = new THREE.Scene();
        const light = new THREE.HemisphereLight(0xbbbbff, 0x444422);
        light.position.set(0, 1, 0);
        scene.add(light);

        initRenderer(canvas);

    }

    // レンダラー設定
    const initRenderer = (canvas) => {
        renderer = new THREE.WebGLRenderer({
            antialias: false,
            alpha: true,
            canvas: document.getElementById(TargetCanvas)
        });
        //renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setPixelRatio(1);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.gammaOutput = true;
        renderer.shadowMap.autoUpdate = false;
        //canvas.appendChild(renderer.domElement);
    }

    //FPS表示
    const initStats = () => {
        stats = new Stats();
        stats.dom.style.position = "relative"
        stats.dom.style.top = "5px";
        stats.dom.style.margin = "auto";
        document.getElementById("debugWindow").appendChild(stats.dom);
    }

    //Jeelizの初期化
    const initfaceFilter = () => {
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
                console.log('INFO: JEEFACETRANSFERAPI IS READY');
                isReady = true;//グローバル
                AVATAR.errorFlag = false;

                if (document.getElementById("loadSpinner") != undefined) {
                    document.getElementById("loadSpinner").remove();
                }
                JEEFACETRANSFERAPI.switch_displayVideo(false);
            }//end callbackReady()

        });
    }

    // ウィンドウサイズ変更
    const onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener(`resize`, onWindowResize, false);


    const addTestObject = () => {
        const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
        const cubeMaterial = new THREE.MeshNormalMaterial();
        const threeCube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        scene.add(threeCube);
    }

    //モデル読み込み
    VAUTA.loadModel = (modelURL) => {
        VAUTA.avatar = new WebVRM(modelURL, scene);
    }



    //  設定処理
    VAUTA.setSetting = function (value, key1, key2) {
        if (key2) {
            settings[key1][key2] = value;
            return;
        }
        settings[key1] = value;
    }

    VAUTA.getSetting = function (key1, key2) {
        if (key2) {
            return settings[key1][key2];
        }
        return settings[key1];
    }
    VAUTA.getAllsettings = function () { return settings; }


    //  ライセンス表示
    VAUTA.dispMetaData = function () {
        document.getElementById("avatarData").style.display = "inline";
        for (const key in AVATAR.metaData) {
            readMetaData(key)
        }
    }

    const readMetaData = function (key) {
        const table = document.getElementById("avatarMetaTable");

        switch (key) {
            case "title":
                document.getElementById("avatarName").innerHTML = AVATAR.metaData[key] || "[名称未設定]";
                break;
            case "texture":
                // function setThumbnail()
                break;
            case "otherPermissionUrl":
                addLicensURL(table, key);

                break;
            case "otherLicenseUrl":
                addLicensURL(table, key);

                break;
            case "allowedUserName":
                if (AVATAR.metaData[key] == "OnlyAuthor") {
                    alert("このアバターを操作することはアバター作者にのみ許されます");
                    AVATAR.isOK = false;
                    // document.getElementById("acceptButton").style.display = "none";
                }
                addLicensItem(table, transferLicense(key), transferLicense(AVATAR.metaData[key]));
                break;
            default:
                addLicensItem(table, transferLicense(key), transferLicense(AVATAR.metaData[key]));
                break;
        }

    }
    const addLicensURL = function (table, key) {
        const row = table.insertRow(-1);
        row.insertCell(-1).appendChild(document.createTextNode(transferLicense(key)));
        const link = document.createElement("a");
        if (AVATAR.metaData[key].match(/(http|https):\/\/.+/)) {
            link.href = AVATAR.metaData[key];
            link.target = "_blank"
        }
        link.innerHTML = " : リンク";
        row.insertCell(-1).appendChild(link);
    }

    const addLicensItem = function (table, key, data) {
        const row = table.insertRow(-1);
        row.insertCell(-1).appendChild(document.createTextNode(key));
        row.insertCell(-1).appendChild(document.createTextNode(" : " + data));
    }

    const transferLicense = function (word) {
        const licenseDictionary = {
            Title: "名前",
            author: "作者",
            contactInformation: "連絡先",
            reference: "参照、親作品",
            version: "バージョン",
            allowedUserName: "アバターに人格を与えることの許諾範囲",
            OnlyAuthor: "アバターを操作することはアバター作者にのみ許される",
            ExplictlyLicensedPerson: "明確に許可された人限定",
            Everyone: "全員に許可",
            Disallow: "不許可",
            Allow: "許可",
            violentUssageName: "このアバターを用いて暴力表現を演じることの許可",
            sexualUssageName: "このアバターを用いて性的表現を演じることの許可",
            commercialUssageName: "商用利用の許可",
            otherPermissionUrl: "その他のライセンス条件",
            licenseName: "ライセンスタイプ",
            Other: "その他",
            otherLicenseUrl: "その他のライセンス条件"
        }
        return licenseDictionary[word] || word || "[未設定]";
    }


    //  フェイスキャプチャ
    VAUTA.UpdateExpression = function () {

        //jeelizのgetメソッドがNaNしか返さなくなる場合がある。
        let faceRotaion = JEEFACETRANSFERAPI.get_rotation();
        let faceExpression = JEEFACETRANSFERAPI.get_morphTargetInfluencesStabilized();
        if (Number.isNaN(faceRotaion[0]) || Number.isNaN(faceExpression[0])) {
            if (!AVATAR.errorFlag) {
                console.log("トラッキングエラー");
                AVATAR.errorFlag = true;
                JEEFACETRANSFERAPI.initialized = false;
                initJeeliz();
            }
            return;
        }

        //頭の向きの追従
        applyHeadRotation(faceRotaion);

        //表情
        // convertExpression(faceExpression);
        // applyThreshold();
        // applyExpression();

    };

    const applyHeadRotation = function (faceRotaions) {
        // let faceRotaion = [
        //     AVATAR.getSetting("headOffset", "x") + faceRotaions[0],
        //     AVATAR.getSetting("headOffset", "y") + faceRotaions[1],
        //     AVATAR.getSetting("headOffset", "z") + faceRotaions[2]
        // ];

        let xd = -1, yd = -1, zd = 1;
        // if (AVATAR.getSetting("isMirror")) {
        //     yd = 1;
        //     zd = -1;
        // }


        // if (AVATAR.head != undefined) {

        //     let headW = 0.5;
        //     let neckW = 0.3;
        //     let chesW = 0.2;

        //     if (AVATAR.upperChest) {
        //         AVATAR.upperChest.rotation.x = xd * faceRotaion[0] * chesW;
        //         AVATAR.upperChest.rotation.y = yd * faceRotaion[1] * chesW;
        //         AVATAR.upperChest.rotation.z = zd * faceRotaion[2] * chesW;
        //     }
        //     else {
        //         headW = 0.7;
        //         neckW = 0.3;
        //     }

        //     if (AVATAR.neck) {
        //         AVATAR.neck.rotation.x = xd * faceRotaion[0] * neckW;
        //         AVATAR.neck.rotation.y = yd * faceRotaion[1] * neckW;
        //         AVATAR.neck.rotation.z = zd * faceRotaion[2] * neckW;
        //     }
        //     else {
        //         headW = 1.0;
        //     }

        VAUTA.avatar.setBoneRotation("head", {
            x: faceRotaions[0],
            y: faceRotaions[1],
            z: faceRotaions[2]
        });
        //     AVATAR.head.rotation.x = xd * faceRotaion[0] * headW;
        //     AVATAR.head.rotation.y = yd * faceRotaion[1] * headW;
        //     AVATAR.head.rotation.z = zd * faceRotaion[2] * headW;

        //     //正面に瞳を合わせる
        //     AVATAR.eyeR.rotation.x = xd * -faceRotaion[0] / 2;
        //     AVATAR.eyeR.rotation.y = yd * -faceRotaion[1] / 2;
        //     //  AVATAR.eyeR.rotation.z = faceRotaion[2] / 2;
        //     AVATAR.eyeL.rotation.x = xd * -faceRotaion[0] / 2;
        //     AVATAR.eyeL.rotation.y = yd * -faceRotaion[1] / 2;
        //     //AVATAR.eyeL.rotation.z = faceRotaion[2] / 2;

        // }


    }


    // 描画更新処理
    VAUTA.update = () => {
        requestAnimationFrame(VAUTA.update);
        VAUTA.UpdateExpression();
        renderer.render(scene, camera);
        stats.update();
    }

}(this));