
jQuery(function () {

    //ファイル読み込み　(ボタン)
    $(`#uploadBtn`).on(`on change`, function () {
        VAUTA.handleFiles(this.files);
    });

    //ファイル読み込み（ドラッグ&ドロップ）
    $(`#dropbox`).on(`dragenter`, function (e) {
        e.stopPropagation();
        e.preventDefault();
    });
    $(`#dropbox`).on(`dragover`, function (e) {
        e.stopPropagation();
        e.preventDefault();
    });
    $(`#dropbox`).on(`drop`, function (e) {
        e.stopPropagation();
        e.preventDefault();
        const files = e.originalEvent.dataTransfer.files;
        VAUTA.handleFiles(files);
    });

    //アコーディオンメニュー
    $(`.accordion`).click(function () {
        $(this).nextAll().slideToggle(200);
    });

    //基本設定用
    $(`.toggleSetting`).on(`on change`, function () {
        const per = $(this).prop(`checked`);
        const id = $(this).attr(`id`);
        VAUTA.setSetting(per, id);
    });

    //背景色変更
    $(`.inputBackGroundColor`).on(`input change`, function () {
        const per = $(this).val();
        const id = `#` + $(this).attr(`id`) + `Text`;
        const r = ($(`#backgroundR`).val() * 1).toString(16).padStart(2, `0`);
        const g = ($(`#backgroundG`).val() * 1).toString(16).padStart(2, `0`);
        const b = ($(`#backgroundB`).val() * 1).toString(16).padStart(2, `0`);
        $(id).html(per.toString().padStart(3, `0`));
        $(`main`).css(`background-color`, `#` + r + g + b);
    });

    //無変化の閾値
    $(`.offThreshold`).on(`input change`, function () {
        const inputPersent = $(this).val();
        const key = $(this).attr(`data-key`);
        $(`#offThreshold` + `-` + key).html((inputPersent / 100).toFixed(2));
        VAUTA.setSetting(inputPersent / 100, `offThreshold`, key);
    });

    //最大変化の閾値
    $(`.onThreshold`).on(`input change`, function () {
        const inputPersent = $(this).val();
        const key = $(this).attr(`data-key`);
        $(`#onThreshold` + `-` + key).html((inputPersent / 100).toFixed(2));
        VAUTA.setSetting(inputPersent / 100, `onThreshold`, key);
    });

    //頭の角度の調整
    $(`.headOffset`).on(`on change`, function () {
        const inputPersent = $(this).val();
        const key = $(this).attr(`data-key`);
        $(`#headOffset` + `-` + key).html(inputPersent + `°`);
        //角度をラジアンへ
        VAUTA.setSetting(inputPersent / 180 * Math.PI, `headOffset`, key);
    });


    //頭の角度の調整
    $(`.headOffset`).on(`input change`, function () {
        const inputPersent = $(this).val();
        const key = $(this).attr(`data-key`);
        $(`#headOffset` + `-` + key).html(inputPersent + `°`);
        //角度をラジアンへ
        VAUTA.setSetting(inputPersent / 180 * Math.PI, `headOffset`, key);
    });

    $(`#avatarScale`).on(`input change`, function () {
        const scale = Math.pow(2, $(this).val() / 10);
        VAUTA.setScale(scale);
        $(`#avatarScaleValue`).html(scale.toFixed(2));
    });

    $(`#acceptButton`).on(`on click`, function () {
        $(`#avatarData`).remove();
    });

    //dowangoのVRM仕様ページ
    $(`#licenseHelp`).on(`on click`, function () {
        window.open(`https://dwango.github.io/vrm/vrm_about/#vrm%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB%E3%81%AB%E8%A8%AD%E5%AE%9A%E3%81%A7%E3%81%8D%E3%82%8B%E3%83%A9%E3%82%A4%E3%82%BB%E3%83%B3%E3%82%B9%E3%83%87%E3%83%BC%E3%82%BF`, `_blank`);

    });

});