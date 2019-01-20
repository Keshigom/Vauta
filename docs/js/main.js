jQuery(function () {


    //アコーディオンメニュー
    $('.accordion').click(function () {
        $(this).nextAll().slideToggle(200);
    });


    $('#subTitleSize').html($('#subTitleSlider').val());
    $('#subTitleSlider').on('input change', function () {
        // 変動
        var per = $(this).val();
        $('#subTitleSize').html(per);
        $('#subText').css('font-size', 2 * per * 0.01 + "vw");

    });

    $('#fullScreenButton').click(function () {
        var isFullScreen = document.fullscreenEnabled ||
            document.webkitFullscreenEnabled ||
            document.mozFullScreenEnabled ||
            document.msFullscreenEnabled ||
            false;
        var elem = document.getElementById("youtube-movie");
        if (isFullScreen) {
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            }
        }
    });

});