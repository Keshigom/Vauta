/*
必須
Three.js
GLTFLoder.js
VRMLoder.js
*/

class WebVRM {

    constructor(
        avatarFileURL,
        targetScene,
        callBackReady = () => {
            console.log("Avatar is Ready")
        }
    ) {
        this._vrm;
        this._skeleton;
        this._blendShape;
        this.isReady = false;
        this._loadVRM(avatarFileURL, targetScene, callBackReady);
    }

    //=======================================================
    //  private method
    //=======================================================

    _loadVRM(avatarFileURL, targetScene, callBackReady) {
        // model
        const loader = new THREE.VRMLoader();
        let loadModel;
        loader.load(avatarFileURL, (vrm) => {
            vrm.scene.name = "VRM";
            // VRMLoader doesn't support VRM Unlit extension yet so
            // converting all materials to MeshBasicMaterial here as workaround so far.
            //マテリアルの変換（Unlit -> MeshBasicMaterial ）
            vrm.scene.traverse((object) => {

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
            this._vrm = vrm;
            targetScene.add(vrm.scene);
            this._initAvatar(vrm);
            this.isReady = true;
            callBackReady();
        });
    }

    _initAvatar(vrm) {
        this._skeleton = new Skeleton(vrm.scene, vrm.parser.json);
        this._blendShape = new BlendShape(vrm.scene, vrm.parser.json);
    }


    //=======================================================
    //  public method
    //=======================================================

    getScene() {
        if (this._vrm === undefined) {
            console.log("Loading is incomplete");
        }
        return this._vrm.scene;
    }

    getMetadata() {
        return this._vrm.parser.json.extensions.VRM.meta;
    }

    getBoneKeys() {
        return this._skeleton.getKeysIterator();
    }
    getExpressionKeys() {
        return this._blendShape.getKeysIterator();
    }

    setBoneRotation(key, angle) {
        this._skeleton.setRotation(key, angle);
    }
    setExpression(key, value) {
        this._blendShape.setExpression(key, value);
    }

    setScale(value) {
        this._vrm.scene.scale.set(value, value, value);
    }

}

//  ポーズ制御
class Skeleton {

    constructor(scene, json) {
        this._boneMap = this._createBoneMap(scene, json);
    }

    //=======================================================
    //  private method
    //=======================================================

    _createBoneMap(scene, json) {

        let boneMap = new Map();
        //VRM規格の標準ボーン名がkeyになっている
        const humanBones = json.extensions.VRM.humanoid.humanBones;
        for (const key in humanBones) {
            const target = humanBones[key];
            boneMap.set(target.bone,
                {
                    name: json.nodes[target.node].name,
                    bone: scene.getObjectByName(json.nodes[target.node].name, true)
                });
        }

        return boneMap;
    }


    //=======================================================
    //  public method
    //=======================================================

    // ボーンの角度を設定　setRotation("head",{x:0,y:0,z:1})
    // key   必須
    // x,y,z 指定したもののみ反映
    setRotation(key, angle) {
        if (this._boneMap.has(key)) {
            if (angle.x != undefined)
                this._boneMap.get(key).bone.rotation.x = angle.x;

            if (angle.y != undefined)
                this._boneMap.get(key).bone.rotation.y = angle.y;

            if (angle.z != undefined)
                this._boneMap.get(key).bone.rotation.z = angle.z;
        }
    }

    getBoneName(key) {
        return this._boneMap.get(key).bone.name;
    }

    //MapIteratorを返す
    getKeysIterator() {
        return this._boneMap.keys();
    }
}

// 表情制御
// TODO:マテリアルの切り替えに対応する

class BlendShape {

    constructor(scene, json) {
        this._blendShapeMap = this._createShapeMap(scene, json);
    }

    //=======================================================
    //  private method
    //=======================================================

    _createShapeMap(scene, json) {
        const blendShapeGroups = json.extensions.VRM.blendShapeMaster.blendShapeGroups;
        let shapeMap = new Map();
        blendShapeGroups.forEach(
            (blendShapeObj) => {
                if (blendShapeObj.presetName != "unknown") {
                    const name = blendShapeObj.name;
                    let targetsObj = this._getTargets(blendShapeObj.binds, json.meshes, scene);
                    shapeMap.set(blendShapeObj.presetName, {
                        name: name,
                        targets: targetsObj
                    });
                }
                else {

                }
            }
        );
        return shapeMap;
    }

    _getTargets(binds, meshes, scene) {
        let targets = [];
        binds.forEach((bind, index) => {
            let target = {};
            const meshName = meshes[bind.mesh].name
            target["meshName"] = meshName;
            target["weight"] = bind.weight;
            target["index"] = bind.index;
            target["morphTargetInfluences"] = this._getMorphTarget(meshName.replace(".baked", ""), scene);

            targets[index] = target;

        });
        return targets;
    }

    _getMorphTarget(name, scene) {
        const targetObj = scene.getObjectByName(name);
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



    //=======================================================
    //  public method
    //=======================================================

    //FIXME:複数の表情を同時に設定するとモデルが破綻する
    //a-oのリップシンクとblink_l,r の瞬きは干渉しないものとしている。
    setExpression(key, value) {
        if (this._blendShapeMap.has(key))
            this._blendShapeMap.get(key).targets.forEach((target) => {
                if ((target.index != undefined) && (target.morphTargetInfluences != undefined))
                    target.morphTargetInfluences[target.index] = value * target.weight * 0.01;
            });
    }

    //MapIteratorを返す
    getKeysIterator() {
        return this._blendShapeMap.keys();
    }
};