// 预先查好的豆瓣不同分类的活动的活动ID
const model = {
    music: [29086248, 29864218, 29765880, 29999612, 29354659, 29122980],
    drama: [29129154, 29730478, 29163465, 29085679, 29979631, 29226275],
    party: [30007955, 29894782, 29943640, 29971061, 30009328, 29985248]
}

// 活动类
class Activity {
    constructor(data) {
        // console.log(data)
        this.image = ko.observable(data.image);
        this.adapt_url = ko.observable(data.adapt_url);
        this.ownerName = ko.observable(data.owner.name);
        this.alt = ko.observable(data.alt);
        this.title = ko.observable(data.title);
        this.content = ko.observable(data.content);
        this.time_str = ko.observable(data.time_str);
        this.address = ko.observable(data.address);
        this.location = ko.observable(data.location);
    }
}

class ViewModel {
    constructor() {
        this.activeList = ko.observableArray([]);
        this.showList = ko.observableArray([]);
        for (let sort in model) {
            model[sort].forEach(id => {
                // 由于豆瓣API的Apikey暂不对个人开放申请
                // 公共API直接进行查询牵扯到跨域问题
                // 暂时使用下载到本地的数据模拟，豆瓣api为：
                // GET https://api.douban.com/v2/event/:id
                // 如果有后端程序可以由后端完成api请求
                fetch('DouBanAPI/' + id)
                    .then(data => data.json())
                    .then(data => {
                        this.activeList.push(new Activity(data))
                    }).catch(e => {
                        console.log(e);
                        alert('豆瓣API调用失败');
                    }).then(() => {
                        return fetch('http://restapi.amap.com/v3/geocode/geo?key=5c2195fa98915a30224b5104ba014f89&city=029&address=' + this.activeList()[(this.activeList().length - 1)].address())
                    }).then(data => data.json()).then(data => {
                        // 检查返回状态是否正常
                        if (data.status) {
                            // 将获取到的坐标存入每个对应的活动中
                            this.activeList()[(this.activeList().length - 1)].location(data.geocodes[0].location);
                        } else {
                            // 返回结果异常，弹出窗口提示用户
                            alert('高德地图地理编码失败，错误码：' + data.infocode)
                            console.log(data)
                        }
                        // 列表显示的活动列表，默认显示音乐类
                        this.showList(this.activeList.slice(0, 6));
                    }).catch(e => {
                        console.log(e);
                        alert('高德地图地理编码API调用失败');
                    });
            });
        };
        // 当前选择显示的活动
        this.currentActive = ko.observableArray([]);

        // 选择活动
        this.chooseActive = clickedActive => {
            this.currentActive(clickedActive);
        };

        // 改变现实的活动列表
        this.chooseList = clickedList => {
            switch (clickedList) {
                case 0:
                    this.showList(this.activeList.slice(0, 6));
                    break;
                case 1:
                    this.showList(this.activeList.slice(6, 12));
                    break;
                case 2:
                    this.showList(this.activeList.slice(12));
            }
        }
    }
}
let view;
ko.applyBindings(view = new ViewModel());
// $.ajax({
//     url: 'https://api.douban.com/v2/event/' + 29086248
// }).done(data => {
//     console.log(JSON.parse(data));
//     console.log(data);
// })

class Map {
    constructor() {}

    initMap() {
        initAMapUI();
        this.map = new AMap.Map('map', {
            resizeEnable: true,
            center: [108.946922, 34.261219],
            zoom: 13
        });
        this.map.plugin(["AMap.ToolBar", 'AMap.Scale', 'AMap.OverView'], function() {
            this.map.addControl(new AMap.Scale());
            // 检测到设备为小屏幕手机时
            if (windowWidth < 640) {
                // 改变缩放级以
                this.map.setZoom(12);
                AMapUI.loadUI(['control/BasicControl'], function(BasicControl) {
                    //添加一个缩放控件
                    this.map.addControl(new BasicControl.Zoom({
                        position: 'rt'
                    }));
                });
            };
            // 检测到设备为大屏幕桌面时
            if (windowWidth >= 640) {
                // 添加工具条以及鹰眼
                this.map.addControl(new AMap.ToolBar());
                this.map.addControl(new AMap.OverView({
                    isOpen: true
                }));
            };
        });
    }

}

let map = new Map();
const windowWidth = $(window).width();

// function initMap() {
//     initAMapUI();
//     map = new AMap.Map('map', {
//         resizeEnable: true,
//         center: [108.946922, 34.261219],
//         zoom: 13
//     });
//     map.plugin(["AMap.ToolBar", 'AMap.Scale', 'AMap.OverView'], function() {
//         map.addControl(new AMap.Scale());
//         // 检测到设备为小屏幕手机时
//         if (windowWidth < 640) {
//             // 改变缩放级以
//             map.setZoom(12);
//             AMapUI.loadUI(['control/BasicControl'], function(BasicControl) {
//                 //添加一个缩放控件
//                 map.addControl(new BasicControl.Zoom({
//                     position: 'rt'
//                 }));
//             });
//         };
//         // 检测到设备为大屏幕桌面时
//         if (windowWidth >= 640) {
//             // 添加工具条以及鹰眼
//             map.addControl(new AMap.ToolBar());
//             map.addControl(new AMap.OverView({
//                 isOpen: true
//             }));
//         };
//     });


// }