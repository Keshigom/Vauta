var AVATAR = AVATAR || {};
(function (global) {
    AVATAR.mixers = new Array();
    AVATAR.neck;
    AVATAR.head;
    AVATAR.morphTarget;

    AVATAR.UpdateExpression = function () {
        if(JEEFACETRANSFERAPI.get_rotation()[0] == NaN){
            console.log("トラッキングエラー");
            return;
        }


        if (AVATAR.morphTarget != undefined) {
            let faceExpression = JEEFACETRANSFERAPI.get_morphTargetInfluencesStabilized();
            

            //眉　↑
            AVATAR.morphTarget.morphTargetInfluences[6] = (faceExpression[4]+faceExpression[5])*0.5;

            //眉　↓
            AVATAR.morphTarget.morphTargetInfluences[8] = (faceExpression[2]+faceExpression[3])*0.5;

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
            AVATAR.morphTarget.morphTargetInfluences[32] = faceExpression[6]/2 + faceExpression[6] * faceExpression[7];
            //くちu
            AVATAR.morphTarget.morphTargetInfluences[30] = faceExpression[7]*0.7;

        }

        let faceRotaion = JEEFACETRANSFERAPI.get_rotation();
        AVATAR.head.rotation.x = -faceRotaion[0];
        AVATAR.head.rotation.y = faceRotaion[1];
        AVATAR.head.rotation.z = -faceRotaion[2];
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