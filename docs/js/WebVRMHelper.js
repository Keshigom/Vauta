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
        this.physics;
        this.clock = new THREE.Clock();

        this.isReady = false;
        this._loadVRM(avatarFileURL, targetScene, callBackReady);
    }

    //=======================================================
    //  private method
    //=======================================================

    _loadVRM(avatarFileURL, targetScene, callBackReady) {
        // const loader = new THREE.VRMLoader();
        // let loadModel;
        // loader.load(avatarFileURL, (vrm) => {
        //     vrm.scene.name = "VRM";
        //     // VRMLoader doesn't support VRM Unlit extension yet so
        //     // converting all materials to MeshBasicMaterial here as workaround so far.
        //     //マテリアルの変換（Unlit -> MeshBasicMaterial ）
        //     vrm.scene.traverse((object) => {

        //         if (object.material) {

        //             if (Array.isArray(object.material)) {

        //                 for (var i = 0, il = object.material.length; i < il; i++) {

        //                     var material = new THREE.MeshBasicMaterial();
        //                     THREE.Material.prototype.copy.call(material, object.material[i]);
        //                     material.color.copy(object.material[i].color);
        //                     material.map = object.material[i].map;
        //                     material.lights = false;
        //                     material.skinning = object.material[i].skinning;
        //                     material.morphTargets = object.material[i].morphTargets;
        //                     material.morphNormals = object.material[i].morphNormals;
        //                     object.material[i] = material;

        //                 }

        //             } else {

        //                 var material = new THREE.MeshBasicMaterial();
        //                 THREE.Material.prototype.copy.call(material, object.material);
        //                 material.color.copy(object.material.color);
        //                 material.map = object.material.map;
        //                 material.lights = false;
        //                 material.skinning = object.material.skinning;
        //                 material.morphTargets = object.material.morphTargets;
        //                 material.morphNormals = object.material.morphNormals;
        //                 object.material = material;

        //             }

        //         }

        //     });
        //     this._vrm = vrm;
        //     targetScene.add(vrm.scene);
        //     this._initAvatar(vrm);
        //     this.isReady = true;
        //     callBackReady();
        // });

        const vrmLoader = new __three_vrm__.VRMLoader();

        vrmLoader.load(
            avatarFileURL,
            (vrm) => {
                targetScene.add(vrm.model);
                this._vrm = vrm;
                this._initAvatar(vrm);
                this.physics = new __three_vrm__.VRMPhysics(vrm);
                this.isReady = true;
                callBackReady();
                // Render the scene.
            },
            function (progress) {
                console.log(progress.loaded / progress.total);
            },
            function (error) {
                console.error(error);
            }
        );
    }

    _initAvatar(vrm) {
        this._skeleton = new Skeleton(vrm);
        this._blendShape = new BlendShape(vrm);
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
        return this._vrm.meta;
    }

    getBoneKeys() {
        return this._skeleton.getKeysIterator();
    }
    getExpressionKeys() {
        // return this._blendShape.getKeysIterator();
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


    update() {
        const delta = this.clock.getDelta();
        this.physics.update(delta);
        //renderer.render(scene, camera);
    }
}

//  ポーズ制御
class Skeleton {

    constructor(vrm) {
        this._boneMap = this._createBoneMap(vrm);
    }

    //=======================================================
    //  private method
    //=======================================================

    _createBoneMap(vrm) {

        let boneMap = new Map();
        //VRM規格の標準ボーン名がkeyになっている
        //const humanBones = json.extensions.VRM.humanoid.humanBones;
        console.log(vrm);
        const humanBones = vrm.humanoid.humanBones;
        for (const key in humanBones) {
            const target = humanBones[key];
            boneMap.set(target.bone,
                {
                    bone: vrm.getNode(target.node)
                });
        }
        console.log(boneMap);
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

    constructor(vrm) {
        this._blendShapeMap = this._createShapeMap(vrm);
        this._vrm = vrm;
    }

    //=======================================================
    //  private method
    //=======================================================

    _createShapeMap(vrm) {
        let shapeMap = new Map();
        vrm.blendShapeMaster.blendShapeGroups.forEach(
            (blendShapeObj, index) => {
                if (blendShapeObj.presetName != "unknown") {
                    shapeMap.set(blendShapeObj.presetName, {
                        index: index,
                        name: blendShapeObj.name
                    })
                }
                else {
                    shapeMap.set(blendShapeObj.name, {
                        index: index,
                        name: blendShapeObj.name
                    })
                }
            });
        console.log(shapeMap);
        return shapeMap;
    }




    //=======================================================
    //  public method
    //=======================================================

    //FIXME:複数の表情を同時に設定するとモデルが破綻する
    //a-oのリップシンクとblink_l,r の瞬きは干渉しないものとしている。
    setExpression(key, value) {
        if (this._blendShapeMap.has(key)) {
            this._vrm.setBlendShapeGroupWeight(this._blendShapeMap.get(key).index, value);
        }
    }

    //MapIteratorを返す
    getKeysIterator() {
        return this._blendShapeMap.keys();
    }
};