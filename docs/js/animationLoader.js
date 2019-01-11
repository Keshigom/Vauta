//MixamoのアニメーションをVRoidに対応させる。

//ボーン名を対応する名前に変更
//mixamoからVRiodに
const correctBoneName = (tracks) => {
    const positions = new Map([
        ["mixamorigHips", "J_Bip_C_Hips"],
    ]);
    const quaternions = new Map([
        ["mixamorigHips", "J_Bip_C_Hips"],
        ["mixamorigSpine", "J_Bip_C_Spine"],
        ["mixamorigSpine1", "J_Bip_C_Chest"],
        ["mixamorigSpine2", "J_Bip_C_UpperChest"],
        ["mixamorigNeck", "J_Bip_C_Neck"],
        ["mixamorigHead", "J_Bip_C_Head"],
        ["mixamorigRightUpLeg", "J_Bip_R_UpperLeg"], ["mixamorigLeftUpLeg", "J_Bip_L_UpperLeg"],
        ["mixamorigRightLeg", "J_Bip_R_LowerLeg"], ["mixamorigLeftLeg", "J_Bip_L_LowerLeg"],
        ["mixamorigRightFoot", "J_Bip_R_Foot"], ["mixamorigLeftFoot", "J_Bip_L_Foot"],
        ["mixamorigRightToeBase", "J_Bip_R_ToeBase"], ["mixamorigLeftToeBase", "J_Bip_L_ToeBase"],
        ["mixamorigRightShoulder", "J_Bip_R_Shoulder"], ["mixamorigLeftShoulder", "J_Bip_L_Shoulder"],
        ["mixamorigRightArm", "J_Bip_R_UpperArm"], ["mixamorigLeftArm", "J_Bip_L_UpperArm"],
        ["mixamorigRightForeArm", "J_Bip_R_LowerArm"], ["mixamorigLeftForeArm", "J_Bip_L_LowerArm"],
        ["mixamorigRightHand", "J_Bip_R_Hand"], ["mixamorigLeftHand", "J_Bip_L_Hand"],
        ["mixamorigRightHandMiddle1", "J_Bip_R_Middle1"], ["mixamorigLeftHandMiddle1", "J_Bip_L_Middle1"],
        ["mixamorigRightHandMiddle2", "J_Bip_R_Middle2"], ["mixamorigLeftHandMiddle2", "J_Bip_L_Middle2"],
        ["mixamorigRightHandMiddle3", "J_Bip_R_Middle3"], ["mixamorigLeftHandMiddle3", "J_Bip_L_Middle3"],
        ["mixamorigRightHandIndex1", "J_Bip_R_Index1"], ["mixamorigLeftHandIndex1", "J_Bip_L_Index1"],
        ["mixamorigRightHandIndex2", "J_Bip_R_Index2"], ["mixamorigLeftHandIndex2", "J_Bip_L_Index2"],
        ["mixamorigRightHandIndex3", "J_Bip_R_Index3"], ["mixamorigLeftHandIndex3", "J_Bip_L_Index3"],
        ["mixamorigRightHandPinky1", "J_Bip_R_Little1"], ["mixamorigLeftHandPinky1", "J_Bip_L_Little1"],
        ["mixamorigRightHandPinky2", "J_Bip_R_Little2"], ["mixamorigLeftHandPinky2", "J_Bip_L_Little2"],
        ["mixamorigRightHandPinky3", "J_Bip_R_Little3"], ["mixamorigLeftHandPinky3", "J_Bip_L_Little3"],
        ["mixamorigRightHandThumb1", "J_Bip_R_Thumb1"], ["mixamorigLeftHandThumb1", "J_Bip_L_Thumb1"],
        ["mixamorigRightHandThumb2", "J_Bip_R_Thumb2"], ["mixamorigLeftHandThumb2", "J_Bip_L_Thumb2"],
        ["mixamorigRightHandThumb3", "J_Bip_R_Thumb3"], ["mixamorigLeftHandThumb3", "J_Bip_L_Thumb3"],
        ["mixamorigRightHandRing1", "J_Bip_R_Ring1"], ["mixamorigLeftHandRing1", "J_Bip_L_Ring1"],
        ["mixamorigRightHandRing2", "J_Bip_R_Ring2"], ["mixamorigLeftHandRing2", "J_Bip_L_Ring2"],
        ["mixamorigRightHandRing3", "J_Bip_R_Ring3"], ["mixamorigLeftHandRing3", "J_Bip_L_Ring3"],
    ]);
    for (const [key, value] of positions) {
        if (tracks.find((obj) => { return obj.name === `${key}.position`; }) != undefined)
            tracks.find((obj) => { return obj.name === `${key}.position`; }).name = `${value}.position`;

    }
    for (const [key, value] of quaternions) {
        if (tracks.find((obj) => { return obj.name === `${key}.quaternion`; }) != undefined) {
            tracks.find((obj) => { return obj.name === `${key}.quaternion`; }).name = `${value}.quaternion`;
        }
    }
}

//Mixamo用からVRoid用にトラックの値を変更
const correctCoordinate = (tracks) => {
    for (let track of tracks) {
        //const track = tracks[j];
        const index = track.name.indexOf(".");
        const ext = track.name.slice(index + 1);
        if (ext == "quaternion") {
            for (let k = 0; k < track.values.length; k += 4) {
                track.values[k + 1] = -track.values[k + 1];
                track.values[k + 3] = -track.values[k + 3];
            }
        } else if (ext == "position") {
            for (let k = 0; k < track.values.length; k += 3) {
                track.values[k] *= -0.01;
                track.values[k + 1] *= 0.01;
                track.values[k + 2] *= -0.01;
            }
        }
    }
}