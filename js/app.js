let map;

function initMap() {
    map = new AMap.Map('container', {
        resizeEnable: true,
        center: [117.000923, 36.675807],
        zoom: 6
    });
    map.plugin(["AMap.ToolBar"], function() {
        map.addControl(new AMap.ToolBar());
    });
}