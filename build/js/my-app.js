// Initialize your app
var myApp = new Framework7();

// Export selectors engine
var $$ = Dom7;

// Add view
var mainView = myApp.addView('.view-main', {
    // Because we use fixed-through navbar we can enable dynamic navbar
    dynamicNavbar: true,
    domCache: true //enable inline pages
});


var SelectPage = function (options) {
    
    this.startx = 0;
    this.starty = 0;
    this.selected = true;
    this.startselect = false;  
    this.throttleTouch = $.throttle(100, true,this._onTouch);
    // this.initTable();

}
SelectPage.prototype._onTouch = function(e){
    var self = this;
    this.$overlay = this.$overlay||$('<div class="kuang"></div>').appendTo(this.$page);
    if(this.startselect){
        e.preventDefault();
        var endx =Math.floor(e.targetTouches[0].clientX);
        var endy =Math.floor(e.targetTouches[0].clientY);
        var startx =self.startx;
        var starty =self.starty;
        var divwidth = endx-startx;
        var divheight = endy-starty;
        if(divwidth < 0) {
            startx = endx + divwidth;
            divwidth = -1 * divwidth;
        }
        if(divheight < 0) {
            starty = endy + divheight;
            divheight = -1 * divheight;
        }
        this.$overlay.css({
            left: startx,
            top: starty,
            width:divwidth,
            height:divheight 
        })
        this.$page.find(".td").each(function(){
            var $this = $(this);
            var thisx = $this.offset().left;
            var thisy = $this.offset().top;
            var thiswidth = $this.width();
            var thisheight = $this.height();
            if(!self.selected) {
                if((thisx<endx&&thisx+thiswidth>=startx)&&(thisy<=endy&&thisy+thisheight>starty)&&(!$this.is(".disable"))){
                    $this.addClass("selected");
                } else {
                    $this.removeClass("selected");
                }
            } else {
                if((thisx<endx&&thisx+thiswidth>=startx)&&(thisy<=endy&&thisy+thisheight>starty)&&(!$this.is(".disable"))){
                    $this.hasClass("selected") ? $this.addClass("no-selected") : $this.addClass("selected2");
                }else{
                    $(this).removeClass("selected2");
                }
            }
        })
    }
}
SelectPage.prototype.render = function(page) {
    this.$page = $(page);
    this.page = Dom7(page);
    this.initTable();
    this.operate();
}
SelectPage.prototype.initTable = function(){
    var tdwidth;
    var tdheight;
    $.ajax({
        url: "../data/data1.json",
        // data: param,
    }).success($.proxy(function(json){
        // console.log(json.resolution);
        this.$page.find(".table").height(json.resolution.height);
        var self = this;
        $.each(json.data,function(){
            tdwidth = this.box[2]-this.box[0];
            tdheight = this.box[3]-this.box[1];
            self.$page.find(".table").append('<div class="td" style="left:'+this.box[0]+'px;top:'+this.box[1]+'px;width:'+tdwidth+'px;height:'+tdheight+'px;line-height:'+tdheight+'px;">'+this.value+'</div>');
        })
    },this))    
}
SelectPage.prototype.operate = function(){
    var self = this;
    //滑动选择操作
     this.page.find(".content-block-inner").on(myApp.touchEvents.start, $.proxy(function(e) {
        if(this.startselect){
            this.selected = this.$page.find(".content-block-inner .selected")[0];
            self.startx =Math.floor( e.targetTouches[0].clientX);
            self.starty = Math.floor(e.targetTouches[0].clientY);
            this.throttleTouch(e);
        }  
    },this)); 
    this.page.find(".content-block-inner").on(myApp.touchEvents.move, function (e){
        self.throttleTouch(e);
    });

    this.page.find(".content-block-inner").on(myApp.touchEvents.end, $.proxy( function(e) { 
        if(this.startselect){
            this.$overlay.remove();
            this.$overlay = null;
            this.$page.find(".no-selected").removeClass("selected").removeClass("no-selected");
            this.$page.find(".selected2").addClass("selected").removeClass("selected2");
        }
    },this));
    //清除选择区域操作
    this.$page.find(".toolbar").on("click", "[name='clearselect']", $.proxy( function() {
        this.$page.find(".selected").removeClass("selected");
    },this));   
    //确认操作
    this.$page.find('.prompt-ok').on('click',  $.proxy(function () {
        startselect=false;
        $(this).siblings().removeClass('selected');
        myApp.prompt('请输入该属性名',[''], function (value) {
            myApp.alert('该属性名是 "' + value + '",确定后点击右上角预览可看到列表',[''],function(){
                if(value){
                    var str = '<div class="list-block"><ul>';
                    var unitsArray = [];
                    $.each(self.$page.find(".td.selected"),function(){
                        var tdvalue = $(this).text();
                        var index = tdvalue.search(/\D/g);
                        if(index<0){
                            num = tdvalue;
                            units = "";
                        }else{
                             num = tdvalue.slice(0, index);
                             units = tdvalue.slice(index);
                        }
                        if(unitsArray.indexOf(units)>-1||units==""){
                            console.log("0");
                        }else{
                            unitsArray.push(units);
                        }
                        str += '<li class="swipeout"><div class="swipeout-content item-content">'+tdvalue.match(/\d+/g)[0]+'</div><input type="text" value="'+tdvalue.match(/\d+/g)[0]+'" class=""><div class="swipeout-actions-right"><a href="#" class=" swipeout-delete delete">删除</a></div></li>';
                    })
                    str+='</ul></div>';
                    if(unitsArray.length>0){
                        var selecthtml='<select name="" class="">';
                        for(i=0;i<unitsArray.length;i++){
                            selecthtml+='<option value ="'+unitsArray[i]+'">'+unitsArray[i]+'</option>'
                            
                        }
                        selecthtml+='</select>';
                        str ='<div class="content-block-title"><div class="lable '+value+'">'+value+'&nbsp;&nbsp;单位：</div><div class="select">'+selecthtml+'</div></div>'+str;
                    }else{
                        str ='<div class="content-block-title"><div class="lable '+value+'">'+value+'</div> </div>'+str;
                    }
                    self.$page.find(".selected").removeClass("selected").addClass('disable');
                    self.$page.find(".kuang").removeClass("kuang");
                    listGenerate.initList(value,str);
                } 
            });
            
        });
    },this));
    //开始选择操作
    this.$page.find(".startSelect").on('click',function(){
        if(self.startselect==true){
            self.startselect=false;
            $(this).removeClass('selected');
        }else{
            self.startselect=true;
             $(this).addClass("selected");
        }
       
    })
}

var selectPage = new SelectPage();
selectPage.render('.page-index');


var ListGenerate = function(options) {
    this.option = {
        title : {
            text: 'ShotVis',
            subtext: '纯属虚构'
        },
        tooltip : {
            trigger: 'axis'
        },
        legend: {
            data:['yname']
        },
        toolbox: {
            show : false,
            feature : {
                mark : {show: true},
                dataView : {show: true, readOnly: false},
                magicType : {show: true, type: ['line', 'bar']},
                restore : {show: true},
                saveAsImage : {show: true}
            }
        },
        calculable : true,
        xAxis : [
            {
                type : 'category',
                data : ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
            }
        ],
        yAxis : [
            {
                type : 'value'
            }
        ],
        series : [
            {
                name:'蒸发量',
                type:'line',
                data:['1111','2222','3333','44444']
            }
        ]
    };
}
ListGenerate.prototype.render = function(page){
    this.$page = $(page);
    this.page = Dom7(page);
    this.operate();
}
ListGenerate.prototype.initList =function(val,str){
        this.$page.find(".xaxis").append('<option value="'+val+'" >'+val+'</option>');
        this.$page.find(".yaxis").append('<option value="'+val+'">'+val+'</option>');
        this.$page.find("#serialize").append(str);
}
ListGenerate.prototype.operate = function(){
    $$(document).on('pageAfterAnimation', '.page[data-page="list"]', function (e) {
        $(myApp.mainView.activePage.container).on('click',function(e){
            var target = $(e.target);
            if(target.parents(".swipeout").length>0||target.hasClass("swipeout")){
                var parentnode = target.hasClass("swipeout")?target:target.parents(".swipeout");
                if(!parentnode.is(".editing")){
                    if( $(this).find('.editing').length>0){
                        var textval =  $(this).find('.editing input').val();
                        $(this).find('.editing .swipeout-content').text(textval);
                        $(this).find('.editing').removeClass('editing');
                        parentnode.addClass('editing');
                        parentnode.find('input').focus();
                    }else{
                        parentnode.addClass('editing');
                        parentnode.find('input').focus();
                    }
                    
                }
            }else{
                var textval =  $(this).find('.editing input').val();
                $(this).find('.editing .swipeout-content').text(textval);
                $(this).find('.editing').removeClass('editing');
            }       
        })    
    })
    this.$page.find("#generate").on('click',  $.proxy(function(){
        var yname = $(".selecty").find('.item-after').text();
        var xname = $(".selectx").find('.item-after').text();
        var xarray = $("."+xname).parent('.content-block-title').next('.list-block').find('.item-content');
        var yarray = $("."+yname).parent('.content-block-title').next('.list-block').find('.item-content');
        var xdata = [];
        var ydata = [];
        xarray.each(function(){
            xdata.push($(this).text());
        })
        yarray.each(function(){
            ydata.push($(this).text());
        })
        this.option.legend.data = [yname];
        this.option.xAxis[0].data = xdata;
        this.option.series[0].data = ydata;
        this.option.series[0].name = yname;
        this.option.title.subtext = '折线图';
        chartsGenerate.initcharts(this.option);   
    },this)); 
    $$(document).on('pageAfterAnimation', '.page[data-page="charts"]',  $.proxy(function (e) {
       chartsGenerate.initcharts(this.option);   
    },this));
}

var listGenerate = new ListGenerate();
listGenerate.render('.page-list');

var ChartsGenerate = function(){
    this.myChart;
} 
ChartsGenerate.prototype.render =function(page){
    this.$page = $(page);
    this.page = Dom7(page);
    this.operate();
}
ChartsGenerate.prototype.initcharts = function(option){
    this.option = option;
    this.myChart = echarts.init(document.getElementById('main'));
    this.myChart.setOption(this.option);  
    setTimeout($.proxy(this.generateImage,this),1000); 
}
ChartsGenerate.prototype.generateImage = function(){
    var self = this;
    var imgwhite = new Image();
    imgwhite.src = 'img/white.jpg';
    var imgtb = new Image();
    imgtb.src = this.myChart.getDataURL();
    $(myApp.mainView.activePage.container).find(".page-content").append('<canvas id="canvas" style="display:none">');
    var ctx = $("#canvas")[0].getContext('2d');
    var imgbg = new Image();
    imgbg.src = 'img/bg.jpg';
    $(imgbg).load(function(){
        var screenwidth =  window.screen.width;
        var imgbgwidth = imgbg.width;
        var imgtbwidth = imgtb.width;
        var imgbgheight = Math.floor(imgbg.height*screenwidth/imgbgwidth);
        var imgtbheight = Math.floor(imgtb.height*250/imgtbwidth);
        var bgheight = Math.max(imgbgheight,imgtbheight+100);
        $("#canvas").attr({"height":bgheight*2,"width":screenwidth*2});
        ctx.drawImage(imgwhite,0,0,screenwidth*2,bgheight*2);
        ctx.drawImage(imgbg,0,0,screenwidth*2,imgbgheight*2);
        ctx.drawImage(imgtb,40*2,60*2,250*2,imgtbheight*2);
        $("#canvas").css({"height":bgheight,"width":screenwidth});
        var image =  $("#canvas")[0].toDataURL("image/png"); 
        // self.getUrl(image);
        if(self.$page.find(".charts").length==0){
            $(myApp.mainView.activePage.container).find('.page-content').append('<img src='+image+' class="charts" >'); 
        }else{
            self.$page.find(".charts").remove();
            $(myApp.mainView.activePage.container).find('.page-content').append('<img src='+image+' class="charts" >'); 
        }
        
    }) 
}
//图片获取
ChartsGenerate.prototype.getUrl = function(str){
    $.ajax({
        type:'get',
        url: "../data/imgurl.txt",
        // data: str,
        data:'1'
    }).success(function(data){
        $('.page-charts').find('.page-content').append('<img src='+data+' class="charts" >');       
    })   
}
ChartsGenerate.prototype.operate =function(){
    $$('.shareTo').on('click', function () {
        var buttons = [
            {
                text: 'To Facebook',
                bold: true,
                onClick: function () {
                    $(".facebook").click();
                    
                }
            },
            {
                text: 'To SinaWeibo',
                bold: true,
                onClick: function () {
                    $(".jtico_tsina").click();
                    
                }
            },
            {
                text: 'To QQZONE',
                onClick: function () {
                    $(".jtico_qzone").click();
                }
            },
            {
                text: 'Cancel',
                color: 'red'
            },
        ];
        myApp.actions(buttons);
    });
    this.$page.find('.bar').on('click',$.proxy(function(){
        this.option.series[0].type='bar';
        this.initcharts(this.option);
    },this))
    this.$page.find('.line').on('click',$.proxy(function(){
        this.option.series[0].type='line';
        this.initcharts(this.option);
    },this))
}
var chartsGenerate = new ChartsGenerate();
chartsGenerate.render('.page-charts');