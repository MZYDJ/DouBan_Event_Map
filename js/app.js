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
        let arrayOfPr = [];

        // 创建初始Promise数组，完成豆瓣API请求
        for (let sort in model) {
            model[sort].forEach(id => {
                // 由于豆瓣API的Apikey暂不对个人开放申请
                // 公共API直接进行查询牵扯到跨域问题
                // 暂时使用下载到本地的数据模拟，豆瓣api为：
                // GET https://api.douban.com/v2/event/:id
                // 如果有后端程序可以由后端完成api请求
                arrayOfPr.push(fetch('DouBanAPI/' + id).then(data => data.json()));
            });
        };

        // 继续链接Promise链，让每个活动ID对应的豆瓣Promise完成后发起高德地理编码Promise请求
        // 并将返回数据按照ID的顺序存入activeList观察数组中
        arrayOfPr = arrayOfPr.map((data, index) => {
            return data.then(data => {
                this.activeList()[index] = new Activity(data);
            }).catch(e => {
                console.log(e);
                alert('豆瓣API第' + index + 1 + '个调用失败、请尝试刷新。');
            }).then(() => {
                return fetch('http://restapi.amap.com/v3/geocode/geo?key=5c2195fa98915a30224b5104ba014f89&city=029&address=' + this.activeList()[index].address());
            }).then(data => data.json()).then(data => {
                // 判断返回结果是否成功
                if (data.status) {
                    // 将获取到的坐标存入每个对应的活动中
                    this.activeList()[index].location(data.geocodes[0].location);
                } else {
                    // 返回结果异常，弹出窗口提示用户
                    alert('高德地图地理编码第' + index + 1 + '个失败，错误码：' + data.infocode)
                    console.log(data)
                };
            }).catch(e => {
                console.log(e);
                alert('高德地图地理编码API第' + index + 1 + '个调用失败、请尝试刷新。');
            });
        });

        Promise.all(arrayOfPr).then(() => {
            // 列表显示的活动列表，默认显示音乐类
            this.showList(this.activeList.slice(0, 6));
            // 初始化标记点
            this.showList().forEach((data, index) => {
                makeMark(data.location(), data.title());
            });
        })


        // 初始化当前选择的活动变量
        this.currentActive = ko.observable();

        // 选择活动以及显示信息窗
        this.chooseActive = clickedActive => {
            this.currentActive(clickedActive);

        };

        // 改变现实的活动列表以及更改标注点
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
            };
            // markers.length = 0;
            this.showList().forEach((data, index) => {
                // console.log(data.location(), data.title())
                updateMark(data.location(), data.title(), index);
            })
        };
    }
}


// 地图初始化
let MAP;

function initMap() {
    initAMapUI();
    MAP = new AMap.Map('map', {
        resizeEnable: true,
        center: [108.946922, 34.261219],
        zoom: 13
    });


    // 添加地图控件
    MAP.plugin(["AMap.ToolBar", 'AMap.Scale', 'AMap.OverView', 'AMap.AdvancedInfoWindow'], function() {
        MAP.addControl(new AMap.Scale());
        const windowWidth = $(window).width();
        // 检测到设备为小屏幕手机时
        if (windowWidth < 640) {
            // 改变缩放级以
            MAP.setZoom(12);
            AMapUI.loadUI(['control/BasicControl'], function(BasicControl) {
                //添加一个缩放控件
                MAP.addControl(new BasicControl.Zoom({
                    position: 'rt'
                }));
            });
        };
        // 检测到设备为大屏幕桌面时
        if (windowWidth >= 640) {
            // 添加工具条以及鹰眼
            MAP.addControl(new AMap.ToolBar({
                position: 'lt'
            }));
            MAP.addControl(new AMap.OverView({
                isOpen: true
            }));
        };

        // 初始化信息窗
        infowindow = new AMap.AdvancedInfoWindow({
            content: "<div class='info-title' data-bind='text: currentActive.title'></div><div class='info-content' data-bind='text: currentActive.content'><img data-bind='attr: {src: currentActive.image}'><br/><a target='_blank' data-bind='attr: {href: currentActive.adapt_url}'>查看详情</a></div>",
            offset: new AMap.Pixel(0, -30)
        });
    });
}


// 存储标记点的数组
let markers = [];
// 设置标记点
function makeMark(location, title) {
    let marker = new AMap.Marker({
        position: location.split(','),
        title: title,
        map: MAP
    });
    markers.push(marker);
    // 判断是否创建完成标记点数组
    if (markers.length == 6) {
        if (MAP) {
            MAP.add(markers);
            MAP.setFitView();
        } else {
            alert('高德地图加载过慢导致标记点异常，请刷新页面。')
        };
    }; 
}

// 更新标记点
function updateMark(location, title, index) {
    markers[index].setPosition(location.split(','));
    markers[index].setTitle(title);
    MAP.setFitView();
}

// 初始化信息窗
let infowindow;
// 更新信息窗位置和内容
function updateInfowindow(location) {
    infowindow.open(MAP, location.split(','));
}

let VIEW;
ko.applyBindings(VIEW = new ViewModel());