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
    AVATAR.morphTarget;

    AVATAR.rawExpressions;
    AVATAR.filteredExpressions;

    AVATAR.init = function (avatarFileURL, threeScene) {
        initJeeliz();
        loadVRM(avatarFileURL, threeScene);
    };

    //jeelizFaceTransfer.js及び*NNC.jsonが必要です
    let initJeeliz = function () {
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
            }, //end callbackReady()

            //called at each render iteration (drawing loop)

            callbackTrack: function (detectState) {
                console.log("callback");
                console.log(detectState);
            } //end callbackTrack()
        });//end init call

    }

    AVATAR.errorFlag = false;
    AVATAR.UpdateExpression = function () {


        if (AVATAR.head != undefined) {
            let faceRotaion = JEEFACETRANSFERAPI.get_rotation();
            if (Number.isNaN(faceRotaion[0])) {
                if (!AVATAR.errorFlag) {
                    console.log("トラッキングエラー:NaN");
                    AVATAR.errorFlag = true;
                    JEEFACETRANSFERAPI.initialized = false;
                    initJeeliz();
                }

                //JEEFACEFILTERAPI.toggle_pause(true); 
                //JEEFACEFILTERAPI.toggle_pause(false);
                return;
            }
            AVATAR.head.rotation.x = -faceRotaion[0];
            AVATAR.head.rotation.y = faceRotaion[1];
            AVATAR.head.rotation.z = -faceRotaion[2];
        }

        if (AVATAR.morphTarget != undefined && AVATAR.morphTarget.morphTargetInfluences != undefined) {
            let faceExpression = JEEFACETRANSFERAPI.get_morphTargetInfluencesStabilized();
            if (Number.isNaN(faceExpression[0])) {
                if (!AVATAR.errorFlag) {
                    console.log("トラッキングエラー:NaN");
                    AVATAR.errorFlag = true;
                    JEEFACETRANSFERAPI.initialized = false;
                    initJeeliz();
                }

                //JEEFACEFILTERAPI.toggle_pause(true); 
                //JEEFACEFILTERAPI.toggle_pause(false);
                return;
            }


            //R eye,"blink_l","blink_r",
            AVATAR.morphTarget.morphTargetInfluences[expressionDictionary["blink_r"]] = faceExpression[9];
            //L eye
            AVATAR.morphTarget.morphTargetInfluences[expressionDictionary["blink_l"]] = faceExpression[8];

            //くちA
            AVATAR.morphTarget.morphTargetInfluences[expressionDictionary["a"]] = faceExpression[6];
            //くちO
            AVATAR.morphTarget.morphTargetInfluences[expressionDictionary["o"]] = (faceExpression[6] + faceExpression[6] * faceExpression[7]) * 0.5;
            //くちu
            AVATAR.morphTarget.morphTargetInfluences[expressionDictionary["u"]] = faceExpression[7] * 0.7;



            //Vroidのみ正常に動作
            //眉　↑
            AVATAR.morphTarget.morphTargetInfluences[6] = (faceExpression[4] + faceExpression[5]) * 0.5;

            //眉　↓
            AVATAR.morphTarget.morphTargetInfluences[8] = (faceExpression[2] + faceExpression[3]) * 0.5;

            //くち 笑顔
            AVATAR.morphTarget.morphTargetInfluences[24] = faceExpression[0] * 0.5 + faceExpression[1] * 0.5;



        }

    };


    AVATAR.debugMessage = function () {
        let message;
        let target = JEEFACETRANSFERAPI.get_morphTargetInfluencesStabilized();
        message =
            "0: smileRight → closed mouth smile right           " + target[0].toFixed(4) + "<br>" +
            "1: smileLeft → closed mouth smile left             " + target[1].toFixed(4) + "<br>" +
            "2: eyeBrowLeftDown → eyebrow left frowned          " + target[2].toFixed(4) + "<br>" +
            "3: eyeBrowRightDown → eyebrow right frowned        " + target[3].toFixed(4) + "<br>" +
            "4: eyeBrowLeftUp → eyebrow left up(surprised)      " + target[4].toFixed(4) + "<br>" +
            "5: eyeBrowRightUp → eyebrow right up(surprised)    " + target[5].toFixed(4) + "<br>" +
            "6: mouthOpen → mouth open                          " + target[6].toFixed(4) + "<br>" +
            "7: mouthRound → mouth round                        " + target[7].toFixed(4) + "<br>" +
            "8: eyeRightClose → close right eye                 " + target[8].toFixed(4) + "<br>" +
            "9: eyeLeftClose → close left eye                   " + target[9].toFixed(4) + "<br>" +
            "10: mouthNasty → mouth nasty(upper lip raised)     " + target[10].toFixed(4) + "<br>";

        return message;
    };

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

            //Tポーズから腕を下ろさせる
            let leftUpperArm = vrm.scene.getObjectByName(boneDictionary["leftUpperArm"], true);
            let rightUpperArm = vrm.scene.getObjectByName(boneDictionary["rightUpperArm"], true);
            leftUpperArm.rotation.z = Math.PI * (70 / 180);
            rightUpperArm.rotation.z = Math.PI * (-70 / 180);


            //表情のモーフターゲットを名前検索で設定する
            //jsonからsceneのモーフの特定方法がわからなかったため
            AVATAR.morphTarget = searchFaceMorph(vrm.scene);
            expressionDictionary = createExpressionDictionary(vrm.parser.json);

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
    let createBoneDictionary = function (json) {
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


    //標準ブレンドシェイプへの連想配列を求める
    //例）
    //{standardName : indexNumber,...}
    //{a            : 28        ,blink: 11...}
    let expressionDictionary;
    let createExpressionDictionary = function (json) {
        //VRM規格の標準の表情
        const standardExpression = ["neutral", "a", "i", "u", "e", "o", "blink", "joy", "angry", "sorrow", "fun", "lookUp", "lookdown", "lookleft", "lookright", "blink_l", "blink_r", "unknown"]
        let expressions = {};
        const humanoid = new Object();
        humanoid.blendShapeGroups = json.extensions.VRM.blendShapeMaster.blendShapeGroups;
        standardExpression.forEach(key => {
            const target = humanoid.blendShapeGroups.find(
                blendShapeGroups => blendShapeGroups.presetName === key
            );
            if (target && (target.binds.length > 0)) {
                expressions[key] = target.binds[0].index;
            }

        });
        return expressions;
    }


    //  表情モーフターゲットの特定
    // 一時的な実装
    let searchFaceMorph = function (scene) {
        let faceObj = scene.getObjectByName("Face", true)
            || scene.getObjectByName("face", true)
            || scene.getObjectByName("FACE", true);

        if (faceObj.morphTargetInfluences) {
            return faceObj;
        }
        else {
            return faceObj.children.find(function (element) {
                let check = element.morphTargetInfluences;
                return check;
            });
        }
    }

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

 */