jQuery(function () {
    //アコーディオンメニュー
    $('.accordion').click(function () {
        $(this).nextAll().slideToggle(200);
    });

    //基本設定用
    $('.toggleSetting').on('on change', function () {
        const per = $(this).prop('checked');
        const id = $(this).attr('id');
        AVATAR.setSetting(per, id);
    });

    //背景色変更
    $('.inputBackGroundColor').on('input change', function () {
        const per = $(this).val();
        const id = "#" + $(this).attr('id') + "Text";
        const r = ($("#backgroundR").val() * 1).toString(16).padStart(2, "0");
        const g = ($("#backgroundG").val() * 1).toString(16).padStart(2, "0");
        const b = ($("#backgroundB").val() * 1).toString(16).padStart(2, "0");
        $(id).html(per.toString().padStart(3, "0"));
        $('main').css("background-color", '#' + r + g + b);
    });


    //無変化の閾値
    $('.offThreshold').on('input change', function () {
        const inputPersent = $(this).val();
        const key = $(this).attr('data-key');
        $('#offThreshold' + '-' + key).html((inputPersent / 100).toFixed(2));
        AVATAR.setSetting(inputPersent / 100, 'offThreshold', key);
    });

    //最大変化の閾値
    $('.onThreshold').on('input change', function () {
        const inputPersent = $(this).val();
        const key = $(this).attr('data-key');
        $('#onThreshold' + '-' + key).html((inputPersent / 100).toFixed(2));
        AVATAR.setSetting(inputPersent / 100, 'onThreshold', key);
    });

    //
    $('.headOffset').on('on change', function () {
        const inputPersent = $(this).val();
        const key = $(this).attr('data-key');
        $('#headOffset' + '-' + key).html(inputPersent + "°");
        AVATAR.setSetting(inputPersent / 180 * Math.PI, 'headOffset', key);
    });
});