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
});