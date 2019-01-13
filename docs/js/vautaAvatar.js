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


            //眉　↑
            AVATAR.morphTarget.morphTargetInfluences[6] = (faceExpression[4] + faceExpression[5]) * 0.5;

            //眉　↓
            AVATAR.morphTarget.morphTargetInfluences[8] = (faceExpression[2] + faceExpression[3]) * 0.5;

            //R eye
            AVATAR.morphTarget.morphTargetInfluences[12] = faceExpression[9];
            //L eye
            AVATAR.morphTarget.morphTargetInfluences[13] = faceExpression[8];

            //くち 笑顔
            AVATAR.morphTarget.morphTargetInfluences[24] = faceExpression[0] + faceExpression[1];
            AVATAR.morphTarget.morphTargetInfluences[24] /= 2;
            //くちA
            AVATAR.morphTarget.morphTargetInfluences[28] = faceExpression[6];
            //くちO
            AVATAR.morphTarget.morphTargetInfluences[32] = (faceExpression[6] + faceExpression[6] * faceExpression[7]) * 0.5;
            //くちu
            AVATAR.morphTarget.morphTargetInfluences[30] = faceExpression[7] * 0.7;

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

    let loadModelIndex = 0;
    let loadAnimationIndex = 0;
    AVATAR.loadVRM = function (threeScene) {
        // model
        var loader = new THREE.VRMLoader();
        loader.load(avatarURL, function (vrm) {

            console.log("Bone index");
            console.log(vrm.parser.json.extensions.VRM.humanoid.humanBones);

            console.log("ブレンドシェイプグループ index");
            console.log(vrm.parser.json.extensions.VRM.blendShapeMaster.blendShapeGroups);
            console.log(vrm);

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

            //ボーンの設定
            let boneMaps = AVATAR.boneMapping(vrm.parser.json);
            console.log(boneMaps);
            AVATAR.neck = vrm.scene.children[3].skeleton.bones[12];
            AVATAR.head = vrm.scene.children[3].skeleton.bones[13];
            AVATAR.head = vrm.scene.getObjectByName(boneMaps["head"], true);
            let leftUpperArm = vrm.scene.getObjectByName(boneMaps["leftUpperArm"], true);
            let rightUpperArm = vrm.scene.getObjectByName(boneMaps["rightUpperArm"], true);
            leftUpperArm.rotation.z =Math.PI*(70/180);
            rightUpperArm.rotation.z =Math.PI*(-70/180);


            //Vroid Only
            //表情のブレンドシェイプ
            AVATAR.morphTarget = vrm.scene.getObjectByName("Face", true) || vrm.scene.getObjectByName("face", true);
            threeScene.add(vrm.scene);

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
    //{standardBoneName: "modelsBoneName"}
    //例）
    //{head            : "head"         ,hips: "waist",jaw: "mouth"...}
    AVATAR.boneMapping = function (json) {
        //VRM規格の標準ボーン
        const standardBone = ["hips", "leftUpperLeg", "rightUpperLeg", "leftLowerLeg", "rightLowerLeg", "leftFoot", "rightFoot", "spine", "chest", "neck", "head", "leftShoulder", "rightShoulder", "leftUpperArm", "rightUpperArm", "leftLowerArm", "rightLowerArm", "leftHand", "rightHand", "leftToes", "rightToes", "leftEye", "rightEye", "jaw", "leftThumbProximal", "leftThumbIntermediate", "leftThumbDistal", "leftIndexProximal", "leftIndexIntermediate", "leftIndexDistal", "leftMiddleProximal", "leftMiddleIntermediate", "leftMiddleDistal", "leftRingProximal", "leftRingIntermediate", "leftRingDistal", "leftLittleProximal", "leftLittleIntermediate", "leftLittleDistal", "rightThumbProximal", "rightThumbIntermediate", "rightThumbDistal", "rightIndexProximal", "rightIndexIntermediate", "rightIndexDistal", "rightMiddleProximal", "rightMiddleIntermediate", "rightMiddleDistal", "rightRingProximal", "rightRingIntermediate", "rightRingDistal", "rightLittleProximal", "rightLittleIntermediate", "rightLittleDistal", "upperChest"];
        
        let boneMap = {};
        const humanoid = new Object();
        humanoid.humanBones = json.extensions.VRM.humanoid.humanBones;
        standardBone.forEach(key => {
            const target = json.extensions.VRM.humanoid.humanBones.find(
                humanBone => humanBone.bone === key
            );
            if (target != undefined) {
                boneMap[key] =json.nodes[target.node].name;
            }

        });
        return boneMap;
    }

}(this));

/*
VRM morphTarget
0	             "Face.M_F00_000_Fcl_ALL_Angry",
1	              "Face.M_F00_000_Fcl_ALL_Fun",
2	              "Face.M_F00_000_Fcl_ALL_Joy",
3	              "Face.M_F00_000_Fcl_ALL_Sorrow",
4	              "Face.M_F00_000_Fcl_ALL_Surprised",
5	              "Face.M_F00_000_Fcl_BRW_Angry",
6	              "Face.M_F00_000_Fcl_BRW_Fun",
7	              "Face.M_F00_000_Fcl_BRW_Joy",
8	              "Face.M_F00_000_Fcl_BRW_Sorrow",
9	              "Face.M_F00_000_Fcl_BRW_Surprised",
10	              "Face.M_F00_000_Fcl_EYE_Angry",
11	              "Face.M_F00_000_Fcl_EYE_Close",
12	              "Face.M_F00_000_Fcl_EYE_Close_R",
13	              "Face.M_F00_000_Fcl_EYE_Close_L",
14	              "Face.M_F00_000_Fcl_EYE_Joy",
15	              "Face.M_F00_000_Fcl_EYE_Joy_R",
16	              "Face.M_F00_000_Fcl_EYE_Joy_L",
17	              "Face.M_F00_000_Fcl_EYE_Sorrow",
18	              "Face.M_F00_000_Fcl_EYE_Surprised",
19	              "Face.M_F00_000_Fcl_EYE_Extra",
20	              "Face.M_F00_000_Fcl_MTH_Up",
21	              "Face.M_F00_000_Fcl_MTH_Down",
22	              "Face.M_F00_000_Fcl_MTH_Angry",
23	              "Face.M_F00_000_Fcl_MTH_Neutral",
24	              "Face.M_F00_000_Fcl_MTH_Fun",
25	              "Face.M_F00_000_Fcl_MTH_Joy",
26	              "Face.M_F00_000_Fcl_MTH_Sorrow",
27	              "Face.M_F00_000_Fcl_MTH_Surprised",
28	              "Face.M_F00_000_Fcl_MTH_A",
29	              "Face.M_F00_000_Fcl_MTH_I",
30	              "Face.M_F00_000_Fcl_MTH_U",
31	              "Face.M_F00_000_Fcl_MTH_E",
32	              "Face.M_F00_000_Fcl_MTH_O",
33	              "Face.M_F00_000_Fcl_HA_Fung1",
34	              "Face.M_F00_000_Fcl_HA_Fung1_Low",
35	              "Face.M_F00_000_Fcl_HA_Fung1_Up",
36	              "Face.M_F00_000_Fcl_HA_Fung2",
37	              "Face.M_F00_000_Fcl_HA_Fung2_Low",
38	              "Face.M_F00_000_Fcl_HA_Fung2_Up",
39	              "EyeExtra.M_F00_000_EyeExtra_On"

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