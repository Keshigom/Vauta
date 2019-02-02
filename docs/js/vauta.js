const TargetCanvas = "threeCanvas";

if (WEBGL.isWebGLAvailable() === false) {

    document.body.appendChild(WEBGL.getWebGLErrorMessage());

}
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
        isAvatarReady = true;
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

    const initRenderer = (canvas) => {
        renderer = new THREE.WebGLRenderer({
            antialias: false,                                   //負荷軽減目的（初期化後の変更は不可）
            alpha: true,                                        //背景色は親要素に依存
            canvas: document.getElementById(TargetCanvas)
        });
        //高解像度なディスプレイの場合高負荷
        //renderer.setPixelRatio(window.devicePixelRatio);
        //ピクセル比を1:1に
        renderer.setPixelRatio(1);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.gammaOutput = true;
        renderer.shadowMap.autoUpdate = false;
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
            //Webカメラ以外のvideoをソースとして使う場合
            // videoSettings: {
            //     videoElement: videoElement
            // },
            callbackReady: function (errCode) {
                if (errCode) {
                    console.log('AN ERROR HAPPENS. ERROR CODE =', errCode);
                    return;
                }
                JEEFACETRANSFERAPI.switch_displayVideo(false);
                console.timeEnd("init jeeliz");
                console.log("Jeeliz is Ready");
                if (!isJeelizReady) {
                    initPose();
                    VAUTA.dispMetaData();
                };
                VAUTA.errorFlag = false;
                isJeelizReady = true;
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

    VAUTA.setScale = function (value) {
        VAUTA.avatar.setScale(value);
    };

    //デバック表示
    VAUTA.toggleDebug = () => {
        VAUTA.setSetting(!VAUTA.getSetting("isDebug"), "isDebug");
        if (VAUTA.getSetting("isDebug")) {
            document.getElementById("debugWindow").style.display = "inline";
        }
        else {
            document.getElementById("debugWindow").style.display = "none";
        }
    }
    //	OPTIMIZE:処理速度に影響が出る
    debugMessage = function () {

        let message;
        let target = JEEFACETRANSFERAPI.get_morphTargetInfluencesStabilized();
        message =
            "Jeeliz Input <br>" +
            "<div><span>0: smileRight </span><span style='right:0px;position: absolute;'> → " + target[0].toFixed(4) + "</span></div>" +
            "<div><span>1: smileLeft </span><span style='right:0px;position: absolute;'> →  " + target[1].toFixed(4) + "</span></div>" +
            "<div><span>2: eyeBrowLeftDown </span><span style='right:0px;position: absolute;'> → " + target[2].toFixed(4) + "</span></div>" +
            "<div><span>3: eyeBrowRightDown </span><span style='right:0px;position: absolute;'> → " + target[3].toFixed(4) + "</span></div>" +
            "<div><span>4: eyeBrowLeftUp </span><span style='right:0px;position: absolute;'> → " + target[4].toFixed(4) + "</span></div>" +
            "<div><span>5: eyeBrowRightUp </span><span style='right:0px;position: absolute;'> → " + target[5].toFixed(4) + "</span></div>" +
            "<div><span>6: mouthOpen </span><span style='right:0px;position: absolute;'> →  " + target[6].toFixed(4) + "</span></div>" +
            "<div><span>7: mouthRound </span><span style='right:0px;position: absolute;'> → " + target[7].toFixed(4) + "</span></div>" +
            "<div><span>8: eyeRightClose </span><span style='right:0px;position: absolute;'> →  " + target[8].toFixed(4) + "</span></div>" +
            "<div><span>9: eyeLeftClose </span><span style='right:0px;position: absolute;'> → " + target[9].toFixed(4) + "</span></div>" +
            "<div><span>10: mouthNasty </span><span style='right:0px;position: absolute;'> → " + target[10].toFixed(4) + "</span></div>" +
            "<br>";

        message +=
            "Facial Expression<br>" +
            "<div><span>name </span><span style='right:0px;position: absolute;'>     : input (OFF- ON)output</span></div>";
        for (let index in VAUTA.rawExpressions) {
            const offThreshold = VAUTA.getSetting("offThreshold", index);
            const onThreshold = VAUTA.getSetting("onThreshold", index);
            message +=
                "<div><span>" + index + "</span><span style='right:0px;position: absolute;'>  :  " +
                VAUTA.rawExpressions[index].toFixed(3) +
                " ( " + offThreshold + " - " +
                onThreshold + " ) " +
                VAUTA.filteredExpressions[index].toFixed(3) + "</span><div>";
        }
        return message;
    };


    //  フェイスキャプチャ
    VAUTA.errorFlag = false;
    VAUTA.UpdateExpression = function () {
        //	FIXME:	jeelizのgetメソッドがNaNしか返さなくなる場合がある。
        //初期化して復帰する
        let faceRotaion = JEEFACETRANSFERAPI.get_rotationStabilized();
        let faceExpression = JEEFACETRANSFERAPI.get_morphTargetInfluencesStabilized();
        if (Number.isNaN(faceRotaion[0]) || Number.isNaN(faceExpression[0])) {
            if (!VAUTA.errorFlag) {
                console.log("トラッキングエラー");
                VAUTA.errorFlag = true;
                JEEFACETRANSFERAPI.initialized = false;
                initJeeliz();
            }
            return;
        }

        if (JEEFACETRANSFERAPI.is_detected()) {

            //頭の向きの追従
            applyHeadRotation(faceRotaion);

            //表情
            convertExpression(faceExpression);
            applyThreshold();
            applyExpression();
        }

    };

    const applyHeadRotation = function (rotaions) {

        let xd = -1, yd = -1, zd = 1;
        if (VAUTA.getSetting("isMirror")) {
            yd = 1;
            zd = -1;
        }
        //     VAUTA.getSetting("headOffset", "x") + faceRotaions[0],
        //     VAUTA.getSetting("headOffset", "y") + faceRotaions[1],
        //     VAUTA.getSetting("headOffset", "y") + faceRotaions[2]

        let faceRotaion = [
            VAUTA.getSetting("headOffset", "x") + xd * rotaions[0],
            VAUTA.getSetting("headOffset", "y") + yd * rotaions[1],
            VAUTA.getSetting("headOffset", "y") + zd * rotaions[2]
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
        VAUTA.rawExpressions["i"] = faceExpression[10];

        // mouthRound -> "u"
        VAUTA.rawExpressions["u"] = faceExpression[7];
        // mouthOpen & mouthRound -> "o"
        VAUTA.rawExpressions["o"] = (faceExpression[6] + faceExpression[6] * faceExpression[7]) * 0.5;

    }

    //入力データに閾値を適用する。
    const applyThreshold = function () {
        for (let index in VAUTA.rawExpressions) {
            const offThreshold = VAUTA.getSetting("offThreshold", index);
            const onThreshold = VAUTA.getSetting("onThreshold", index);
            const value = VAUTA.rawExpressions[index];
            VAUTA.filteredExpressions[index] = threshold(value, offThreshold, onThreshold);
        }
    }
    const threshold = (value, start, end) => {
        if (value < start || start >= 1) {
            return 0;
        }
        else if (value > end || end <= 0) {
            return 1;
        }
        else if (end != start) {
            return (value - start) / (end - start);
        }

        return value;
    }

    //表情状態をモデルに適用する。
    const applyExpression = function () {
        VAUTA.avatar.setExpression("blink_r", VAUTA.filteredExpressions["blink_r"]);
        VAUTA.avatar.setExpression("blink_l", VAUTA.filteredExpressions["blink_l"]);
        VAUTA.avatar.setExpression("a", VAUTA.filteredExpressions["a"]);
        VAUTA.avatar.setExpression("i", VAUTA.filteredExpressions["i"]);
        VAUTA.avatar.setExpression("u", VAUTA.filteredExpressions["u"]);
        VAUTA.avatar.setExpression("o", VAUTA.filteredExpressions["o"]);

    }

    let clock = new THREE.Clock();
    // 描画更新処理
    VAUTA.update = () => {
        requestAnimationFrame(VAUTA.update);

        if (isAvatarReady && isJeelizReady) {
            //描画間隔にあわせて、検出間隔を変更する
            let delta = clock.getDelta();
            JEEFACETRANSFERAPI.set_animateDelay(delta);

            VAUTA.UpdateExpression();
            if (VAUTA.getSetting("isDebug")) {
                let debugFaceData = document.getElementById("faceData");
                debugFaceData.innerHTML = debugMessage();
            }
        }

        renderer.render(scene, camera);
        stats.update();
    }




    //  ライセンス表示
    VAUTA.metaData;
    VAUTA.dispMetaData = function () {
        VAUTA.metaData = VAUTA.avatar.getMetadata();
        document.getElementById("avatarData").style.display = "inline";
        for (const key in VAUTA.metaData) {
            readMetaData(key)
        }
    }

    const readMetaData = function (key) {
        const table = document.getElementById("avatarMetaTable");

        switch (key) {
            case "title":
                document.getElementById("avatarName").innerHTML = VAUTA.metaData[key] || "[名称未設定]";
                break;

            case "texture":
                // TODO:アバターサムネイル画像の表示
                // function setThumbnail()
                break;

            case "otherPermissionUrl":
                addLicensURL(table, key);
                break;

            case "otherLicenseUrl":
                addLicensURL(table, key);
                break;

            case "allowedUserName":
                //アバター利用が作者のみの場合、フェイストラックを切る
                if (VAUTA.metaData[key] == "OnlyAuthor") {
                    alert("このアバターを操作することはアバター作者にのみ許されます");
                    isAvatarReady = false;
                    // document.getElementById("acceptButton").style.display = "none";
                }
                addLicensItem(table, transferLicense(key), transferLicense(VAUTA.metaData[key]));
                break;

            default:
                addLicensItem(table, transferLicense(key), transferLicense(VAUTA.metaData[key]));
                break;
        }

    }

    //http,https以外はただの文字列として表示する
    //文字数を制限するためURLクエリの"?"以降は表示しない
    const addLicensURL = function (table, key) {
        const row = table.insertRow(-1);
        row.insertCell(-1).appendChild(document.createTextNode(transferLicense(key)));
        const link = document.createElement("a");
        if (VAUTA.metaData[key].match(/(http|https):\/\/.+/)) {
            link.href = VAUTA.metaData[key];
            link.target = "_blank"
        }
        let str = VAUTA.metaData[key];
        const index = str.indexOf("?");
        if (index > 0) {
            str = str.substring(0, index);
        }

        link.appendChild(document.createTextNode(str));
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
            otherPermissionUrl: "アバターの人格に関するその他のライセンス条件",
            licenseName: "ライセンスタイプ",
            Other: "その他",
            otherLicenseUrl: "その他のライセンス条件"
        }
        return licenseDictionary[word] || word || "[未設定]";
    }


}(this));
VAUTA.init(document.getElementById(TargetCanvas));
