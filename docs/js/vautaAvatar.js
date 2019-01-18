/*
依存先
JEEFACETRANSFERAPI（jeelizFaceTransfer.js）
Three.js
GLTFLoder.js
VRMLoder.js
WebGL.js
*/

var AVATAR = AVATAR || {};
(function (global) {
    AVATAR.mixers = new Array();
    AVATAR.neck;
    AVATAR.head;
    AVATAR.upperChest;
    AVATAR.eyeR;
    AVATAR.eyeL;

    AVATAR.rawExpressions = {};
    AVATAR.filteredExpressions = {};

    AVATAR.init = function (avatarFileURL, threeScene) {
        initJeeliz();
        loadVRM(avatarFileURL, threeScene);
        initThreshold();
    };

    //jeelizFaceTransfer.js及び*NNC.jsonが必要です
    const initJeeliz = function () {
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
                isReady = true;//グローバル
                AVATAR.errorFlag = false;
                JEEFACETRANSFERAPI.switch_displayVideo(false);
            }, //end callbackReady()

            //called at each render iteration (drawing loop)

            callbackTrack: function (detectState) {
                console.log("callback");
                console.log(detectState);
            } //end callbackTrack()
        });//end init call

    }

    const initThreshold = function () {
        const standard = [
            "neutral",
            "a", "i", "u", "e", "o",
            "blink", "joy", "angry", "sorrow", "fun", "lookUp", "lookdown", "lookleft", "lookright",
            "blink_l", "blink_r"];

        standard.forEach(function (target) {
            //無変化の閾値
            AVATAR.setSetting(0, "offThreshold", target);
            //最大変化の閾値
            AVATAR.setSetting(1, "onThreshold", target);
        });
    }


    AVATAR.errorFlag = false;
    AVATAR.UpdateExpression = function () {

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
        convertExpression(faceExpression);
        applyThreshold();
        applyExpression();

    };

    const applyHeadRotation = function (faceRotaions) {
        let faceRotaion = [
            AVATAR.getSetting("headOffset", "x") + faceRotaions[0],
            AVATAR.getSetting("headOffset", "y") + faceRotaions[1],
            AVATAR.getSetting("headOffset", "z") + faceRotaions[2]];

        let xd = -1, yd = -1, zd = 1;
        if (AVATAR.getSetting("isMirror")) {
            yd = 1;
            zd = -1;
        }


        if (AVATAR.head != undefined) {

            let headW = 0.5;
            let neckW = 0.3;
            let chesW = 0.2;

            if (AVATAR.upperChest) {
                AVATAR.upperChest.rotation.x = xd * faceRotaion[0] * chesW;
                AVATAR.upperChest.rotation.y = yd * faceRotaion[1] * chesW;
                AVATAR.upperChest.rotation.z = zd * faceRotaion[2] * chesW;
            }
            else {
                headW = 0.7;
                neckW = 0.3;
            }

            if (AVATAR.neck) {
                AVATAR.neck.rotation.x = xd * faceRotaion[0] * neckW;
                AVATAR.neck.rotation.y = yd * faceRotaion[1] * neckW;
                AVATAR.neck.rotation.z = zd * faceRotaion[2] * neckW;
            }
            else {
                headW = 1.0;
            }

            AVATAR.head.rotation.x = xd * faceRotaion[0] * headW;
            AVATAR.head.rotation.y = yd * faceRotaion[1] * headW;
            AVATAR.head.rotation.z = zd * faceRotaion[2] * headW;

            //正面に瞳を合わせる
            AVATAR.eyeR.rotation.x = xd * -faceRotaion[0] / 2;
            AVATAR.eyeR.rotation.y = yd * -faceRotaion[1] / 2;
            //  AVATAR.eyeR.rotation.z = faceRotaion[2] / 2;
            AVATAR.eyeL.rotation.x = xd * -faceRotaion[0] / 2;
            AVATAR.eyeL.rotation.y = yd * -faceRotaion[1] / 2;
            //AVATAR.eyeL.rotation.z = faceRotaion[2] / 2;

        }

    }



    //animation
    //[CHECK]
    // const animationFiles = ['assets/motion/Idle.gltf'];
    // const animationLoader = new THREE.GLTFLoader();
    // for (let i = 0; i < animationFiles.length; ++i) {
    //     animationLoader.load(animationFiles[i], function () { });
    // }
    //let loadModelIndex = 0;
    //let loadAnimationIndex = 0;

    let loadVRM = function (avatarFileURL, threeScene) {
        // model
        var loader = new THREE.VRMLoader();
        loader.load(avatarFileURL, function (vrm) {
            vrm.scene.name = "VRM";

            // VRMLoader doesn't support VRM Unlit extension yet so
            // converting all materials to MeshBasicMaterial here as workaround so far.
            //マテリアルの変換（Unlit -> MeshBasicMaterial ）
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

            //ボーンの設定
            boneDictionary = createBoneDictionary(vrm.parser.json);
            AVATAR.head = vrm.scene.getObjectByName(boneDictionary["head"], true);
            AVATAR.neck = vrm.scene.getObjectByName(boneDictionary["neck"], true);
            AVATAR.upperChest = vrm.scene.getObjectByName(boneDictionary["upperChest"], true) || vrm.scene.getObjectByName(boneDictionary["chest"], true);

            AVATAR.eyeR = vrm.scene.getObjectByName(boneDictionary["rightEye"], true);
            AVATAR.eyeL = vrm.scene.getObjectByName(boneDictionary["leftEye"], true);


            //Tポーズから腕を下ろさせる
            let leftUpperArm = vrm.scene.getObjectByName(boneDictionary["leftUpperArm"], true);
            let rightUpperArm = vrm.scene.getObjectByName(boneDictionary["rightUpperArm"], true);
            leftUpperArm.rotation.z = Math.PI * (70 / 180);
            rightUpperArm.rotation.z = Math.PI * (-70 / 180);


            AVATAR.blendShapeDictionary = AVATAR.createShapeDictionary(vrm);
            //three.jsのシーンへ追加
            threeScene.add(vrm.scene);

            //デバッグ用
            AVATAR.VRM = vrm;

            //アニメーションの紐付け
            //[CHECK]
            //一時無効化
            // let mixer = new THREE.AnimationMixer(vrm.scene);
            // animationLoader.load(animationFiles[loadAnimationIndex], function (gltf) {
            //     const animations = gltf.animations;
            //     if (animations && animations.length) {
            //         for (let animation of animations) {
            //             correctBoneName(animation.tracks);
            //             correctCoordinate(animation.tracks);
            //             mixer.clipAction(animation).play();
            //         }
            //     }
            // });
            //AVATAR.mixers.push(mixer);
        });

    }

    //標準ボーンとモデル固有のボーン名の対応の連想配列を求める
    //例）
    //{standardBoneName: "modelsBoneName",...}
    //{head            : "head"         ,hips: "waist",jaw: "mouth"...}
    let boneDictionary;
    const createBoneDictionary = function (json) {
        //VRM規格の標準ボーン
        const standardBone = ["hips", "leftUpperLeg", "rightUpperLeg", "leftLowerLeg", "rightLowerLeg", "leftFoot", "rightFoot", "spine", "chest", "neck", "head", "leftShoulder", "rightShoulder", "leftUpperArm", "rightUpperArm", "leftLowerArm", "rightLowerArm", "leftHand", "rightHand", "leftToes", "rightToes", "leftEye", "rightEye", "jaw", "leftThumbProximal", "leftThumbIntermediate", "leftThumbDistal", "leftIndexProximal", "leftIndexIntermediate", "leftIndexDistal", "leftMiddleProximal", "leftMiddleIntermediate", "leftMiddleDistal", "leftRingProximal", "leftRingIntermediate", "leftRingDistal", "leftLittleProximal", "leftLittleIntermediate", "leftLittleDistal", "rightThumbProximal", "rightThumbIntermediate", "rightThumbDistal", "rightIndexProximal", "rightIndexIntermediate", "rightIndexDistal", "rightMiddleProximal", "rightMiddleIntermediate", "rightMiddleDistal", "rightRingProximal", "rightRingIntermediate", "rightRingDistal", "rightLittleProximal", "rightLittleIntermediate", "rightLittleDistal", "upperChest"];

        let boneMap = {};
        const humanoid = new Object();
        humanoid.humanBones = json.extensions.VRM.humanoid.humanBones;
        standardBone.forEach(key => {
            const target = humanoid.humanBones.find(
                humanBone => humanBone.bone === key
            );
            if (target != undefined) {
                boneMap[key] = json.nodes[target.node].name;
            }

        });
        return boneMap;
    }

    //標準ブレンドシェイプとthreeオブジェクトと結びつける
    AVATAR.createShapeDictionary = function (vrm) {
        //VRM規格の標準の表情
        const json = vrm.parser.json
        const getShapeDictionary = function (blendShapeGroups) {
            let ShapeDictionary = {};
            blendShapeGroups.forEach(
                function (blendShapeObj) {
                    if (blendShapeObj.presetName != "unknown") {
                        const name = blendShapeObj.name;
                        let targetsObj = getTargets(blendShapeObj.binds);
                        ShapeDictionary[blendShapeObj.presetName] = {
                            name: name,
                            targets: targetsObj
                        }
                    }
                    else {

                    }
                }
            );
            return ShapeDictionary;
        }

        const getTargets = function (binds) {
            let targets = [];
            binds.forEach(function (bind, index) {
                let target = {};
                const meshName = json.meshes[bind.mesh].name
                target["meshName"] = meshName;
                target["weight"] = bind.weight;
                target["index"] = bind.index;
                target["morphTargetInfluences"] = getMorphTarget(meshName.replace(".baked", ""));

                targets[index] = target;

            });
            return targets;
        }

        const getMorphTarget = function (name) {
            const targetObj = vrm.scene.getObjectByName(name);
            if (targetObj != undefined) {
                if (targetObj.morphTargetInfluences != undefined) {
                    return targetObj.morphTargetInfluences;

                }
                else if (targetObj.children != undefined) {
                    let morphTarget;
                    targetObj.children.forEach(function (child) {
                        if (child.morphTargetInfluences != undefined) {
                            morphTarget = child.morphTargetInfluences;
                        }
                    });
                    return morphTarget;
                }
            }
        }

        let blendShapeDictionary = getShapeDictionary(json.extensions.VRM.blendShapeMaster.blendShapeGroups);
        return blendShapeDictionary;

    }

    AVATAR.blendShapeDictionary;
    //表情ブレンドシェイプを上書きする。
    //競合があった場合最後に実行されたもので上書きされる。
    AVATAR.expressionSetValue = function (key, value) {
        AVATAR.blendShapeDictionary[key].targets.forEach(function (target) {
            target.morphTargetInfluences[target.index] = value * target.weight * 0.01;
        });
    }


    //jeelizの表情データをVRM用に変換する。
    const convertExpression = function (faceExpression) {

        if (AVATAR.getSetting("isMirror")) {
            //eyeRightClose
            AVATAR.rawExpressions["blink_r"] = faceExpression[9];
            //eyeLeftClose
            AVATAR.rawExpressions["blink_l"] = faceExpression[8];
        }
        else {
            //eyeRightClose
            AVATAR.rawExpressions["blink_r"] = faceExpression[8];
            //eyeLeftClose
            AVATAR.rawExpressions["blink_l"] = faceExpression[9];
        }
        // mouthOpen -> "a"
        AVATAR.rawExpressions["a"] = faceExpression[6];
        // mouthOpen & mouthRound -> "o"
        AVATAR.rawExpressions["o"] = (faceExpression[6] + faceExpression[6] * faceExpression[7]) * 0.5;
        // mouthRound -> "u"
        AVATAR.rawExpressions["u"] = faceExpression[7] * 0.7;
    }

    //入力データに閾値を適用する。
    const applyThreshold = function () {
        for (let index in AVATAR.rawExpressions) {
            const offThreshold = AVATAR.getSetting("offThreshold", index);
            const onThreshold = AVATAR.getSetting("onThreshold", index);
            let value = AVATAR.rawExpressions[index];
            if (value < offThreshold || offThreshold >= 1) value = 0;
            if (value > onThreshold || onThreshold <= 0) value = 1;
            AVATAR.filteredExpressions[index] = value;
        }
    }

    //表情状態をモデルに適用する。
    const applyExpression = function () {
        AVATAR.expressionSetValue("blink_r", AVATAR.filteredExpressions["blink_r"]);
        AVATAR.expressionSetValue("blink_l", AVATAR.filteredExpressions["blink_l"]);
        AVATAR.expressionSetValue("a", AVATAR.filteredExpressions["a"]);
        AVATAR.expressionSetValue("o", AVATAR.filteredExpressions["o"]);
        AVATAR.expressionSetValue("u", AVATAR.filteredExpressions["u"]);
    }


    // 設定項目
    // settings[type][key] 
    let settings = {
        "offThreshold": {},     //無変化の閾値
        "onThreshold": {},      //最大変化の閾値
        "isMirror": true,       //鏡のように動作させる（右目を閉じるとアバターは左目を閉じる）
        "headOffset": {         //顔の向きが中心になるように調整する
            "x": 0,
            "y": 0,
            "z": 0,              //y,z は非推奨
        }
    };

    AVATAR.setSetting = function (value, key1, key2) {
        if (key2) {
            settings[key1][key2] = value;
            return;
        }
        settings[key1] = value;
    }
    AVATAR.getSetting = function (key1, key2) {
        if (key2) {
            return settings[key1][key2];
        }
        return settings[key1];
    }
    AVATAR.getAllsettings = function () { return settings; }

    AVATAR.debugMessage = function () {
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
        for (let index in AVATAR.rawExpressions) {
            const offThreshold = AVATAR.getSetting("offThreshold", index);
            const onThreshold = AVATAR.getSetting("onThreshold", index);
            message +=
                "<div><span>" + index + "</span><span style='right:0px;position: absolute;'>  :  " +
                AVATAR.rawExpressions[index].toFixed(3) +
                " ( " + offThreshold + " - " +
                onThreshold + " ) " +
                AVATAR.filteredExpressions[index].toFixed(3) + "</span><div>";
        }
        return message;
    };


}(this));
/*
JEELIZ
0: smileRight → closed mouth smile right
1: smileLeft → closed mouth smile left
2: eyeBrowLeftDown → eyebrow left frowned
3: eyeBrowRightDown → eyebrow right frowned
4: eyeBrowLeftUp → eyebrow left up (surprised)
5: eyeBrowRightUp → eyebrow right up (surprised)
6: mouthOpen → mouth open
7: mouthRound → mouth round
8: eyeRightClose → close right eye
9: eyeLeftClose → close left eye
10: mouthNasty → mouth nasty (upper lip raised)

VRM
0:   "neutral",
1:   "a",
2:   "i",
3:   "u",
4:   "e",
5:   "o",
6:   "blink",
7:   "joy",
8:   "angry",
9:   "sorrow",
10:  "fun",
11:  "lookUp",
12:  "lookdown",
13:  "lookleft",
14:  "lookright",
15:  "blink_l",
16:  "blink_r",
17:  "unknown"

人は誰かになれる
 */