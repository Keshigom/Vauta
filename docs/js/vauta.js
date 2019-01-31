const TargetCanvas = "threeCanvas";
var VAUTA = VAUTA || {};
(function (global) {


    //ファイルを読み込む
    //TODO:複数ファイルに対応する(テクスチャなど)
    VAUTA.handleFiles = (filesObj) => {
        document.getElementById("loadSpinner").classList.add("is-active");
        dropbox.style.display = "none";
        console.time("load Avatar");
        const avatarURL = window.URL.createObjectURL(filesObj[0]);
        VAUTA.loadModel(avatarURL);
        console.timeEnd("load Avatar");

        initJeeliz();
    }


    // 初期化
    VAUTA.init = (targetCanvas, avatarURL) => {
        initThree(targetCanvas);
        initStats();
        initThreshold();
        //描画開始
        VAUTA.update();
    }

    let isAvatarReady = false;
    //モデル読み込み
    VAUTA.loadModel = (modelURL) => {
        VAUTA.avatar = new WebVRM(modelURL, scene);
        VAUTA.isAvatarReady = true;
    }

    //Three.jsの初期化
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
        console.log("scene Ready")
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
    let isJeelizReady = false;
    const initJeeliz = () => {
        console.time("init jeeliz");
        JEEFACETRANSFERAPI.init({
            canvasId: 'jeefacetransferCanvas',
            NNCpath: '../lib/jeeliz/',          //  jeelizのニューラルネットワークJSONファイルがあるディレクトリ
            // videoSettings: {
            //     videoElement: videoElement
            // },
            callbackReady: function (errCode, spec) {
                if (errCode) {
                    console.log('AN ERROR HAPPENS. ERROR CODE =', errCode);
                    return;
                }
                // [init scene with spec...]
                JEEFACETRANSFERAPI.switch_displayVideo(false);
                console.timeEnd("init jeeliz");
                console.log("Jeeliz is Ready");
                isJeelizReady = true;
                initPose();
                if (document.getElementById("loadSpinner") != undefined) {
                    document.getElementById("loadSpinner").remove();
                }
            }//end callbackReady()

        });
    }

    //Tポーズから腕を下ろさせる
    const initPose = () => {
        const armRotation = Math.PI * (-70 / 180);

        VAUTA.avatar.setBoneRotation("leftUpperArm",
            {
                z: -armRotation
            });
        VAUTA.avatar.setBoneRotation("rightUpperArm",
            {
                z: armRotation
            });
    }


    // ウィンドウサイズ変更
    const onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", onWindowResize, false);


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

    const initThreshold = function () {
        const standard = [
            "neutral",
            "a", "i", "u", "e", "o",
            "blink", "joy", "angry", "sorrow", "fun", "lookUp", "lookdown", "lookleft", "lookright",
            "blink_l", "blink_r"];

        standard.forEach(function (target) {
            //無変化の閾値
            VAUTA.setSetting(0, "offThreshold", target);
            //最大変化の閾値
            VAUTA.setSetting(1, "onThreshold", target);
        });
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

    const applyHeadRotation = function (rotaions) {

        let xd = -1, yd = -1, zd = 1;
        if (AVATAR.getSetting("isMirror")) {
            yd = 1;
            zd = -1;
        }
        //     AVATAR.getSetting("headOffset", "x") + faceRotaions[0],
        //     AVATAR.getSetting("headOffset", "y") + faceRotaions[1],
        //     AVATAR.getSetting("headOffset", "z") + faceRotaions[2]

        let faceRotaion = [
            xd * rotaions[0],
            yd * rotaions[1],
            zd * rotaions[2]
        ];


        const headW = 0.5;
        const neckW = 0.3;
        const spineW = 0.2;

        VAUTA.avatar.setBoneRotation("head", {
            x: faceRotaion[0] * headW,
            y: faceRotaion[1] * headW,
            z: faceRotaion[2] * headW
        });
        VAUTA.avatar.setBoneRotation("neck", {
            x: faceRotaion[0] * neckW,
            y: faceRotaion[1] * neckW,
            z: faceRotaion[2] * neckW
        });
        VAUTA.avatar.setBoneRotation("spine", {
            x: faceRotaion[0] * spineW,
            y: faceRotaion[1] * spineW,
            z: faceRotaion[2] * spineW
        });

        lookAt(faceRotaion, "front");

    }

    const lookAt = (faceRotaion, mode = "default", ) => {
        switch (mode) {
            //体の正面に瞳を合わせる
            case "front":
                VAUTA.avatar.setBoneRotation("leftEye", {
                    x: -faceRotaion[0] / 2,
                    y: -faceRotaion[1] / 2,
                });
                VAUTA.avatar.setBoneRotation("rightEye", {
                    x: -faceRotaion[0] / 2,
                    y: -faceRotaion[1] / 2,
                });

                break;

            case "over":
                VAUTA.avatar.setBoneRotation("leftEye", {
                    x: faceRotaion[0] * 0.1,
                    y: faceRotaion[1] * 0.3,
                });
                VAUTA.avatar.setBoneRotation("rightEye", {
                    x: faceRotaion[0] * 0.1,
                    y: faceRotaion[1] * 0.3,
                });

                break;
            //顔の向きと同一
            default://mode="default"
                VAUTA.avatar.setBoneRotation("leftEye", {
                    x: 0,
                    y: 0,
                    z: 0
                });
                VAUTA.avatar.setBoneRotation("rightEye", {
                    x: 0,
                    y: 0,
                    z: 0,
                });
                break;
        }
    }

    VAUTA.rawExpressions = {};
    VAUTA.filteredExpressions = {};
    //jeelizの表情データをVRM用に変換する。
    const convertExpression = function (faceExpression) {

        if (VAUTA.getSetting("isMirror")) {
            //eyeRightClose
            VAUTA.rawExpressions["blink_r"] = faceExpression[9];
            //eyeLeftClose
            VAUTA.rawExpressions["blink_l"] = faceExpression[8];
        }
        else {
            //eyeRightClose
            VAUTA.rawExpressions["blink_r"] = faceExpression[8];
            //eyeLeftClose
            VAUTA.rawExpressions["blink_l"] = faceExpression[9];
        }
        // mouthOpen -> "a"
        VAUTA.rawExpressions["a"] = faceExpression[6];
        // mouthOpen & mouthRound -> "o"
        VAUTA.rawExpressions["o"] = (faceExpression[6] + faceExpression[6] * faceExpression[7]) * 0.5;
        // mouthRound -> "u"
        VAUTA.rawExpressions["u"] = faceExpression[7] * 0.7;
    }

    //入力データに閾値を適用する。
    const applyThreshold = function () {
        for (let index in VAUTA.rawExpressions) {
            const offThreshold = VAUTA.getSetting("offThreshold", index);
            const onThreshold = VAUTA.getSetting("onThreshold", index);
            let value = VAUTA.rawExpressions[index];
            if (value < offThreshold || offThreshold >= 1) value = 0;
            if (value > onThreshold || onThreshold <= 0) value = 1;
            VAUTA.filteredExpressions[index] = value;
        }
    }

    //表情状態をモデルに適用する。
    const applyExpression = function () {
        VAUTA.expressionSetValue("blink_r", VAUTA.filteredExpressions["blink_r"]);
        VAUTA.expressionSetValue("blink_l", VAUTA.filteredExpressions["blink_l"]);
        VAUTA.expressionSetValue("a", VAUTA.filteredExpressions["a"]);
        VAUTA.expressionSetValue("o", VAUTA.filteredExpressions["o"]);
        VAUTA.expressionSetValue("u", VAUTA.filteredExpressions["u"]);
    }

    // 描画更新処理
    VAUTA.update = () => {
        requestAnimationFrame(VAUTA.update);

        if (isAvatarReady && isJeelizReady) {
            VAUTA.UpdateExpression();

        }

        renderer.render(scene, camera);
        stats.update();
    }




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


}(this));
VAUTA.init(document.getElementById(TargetCanvas));
