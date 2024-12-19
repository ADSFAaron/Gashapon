// 網址分析
function analyzeUrl() {
  var webUrl = location.search
  var webUrlData = {
    "csv": "",
    "google": "",
    "title": "",
  }

  // 網址文字分段
  webUrl = webUrl.slice(1);   // 去除第一個問號?字元
  webUrl = webUrl.split("&"); // 分段

  // 將文字丟入 webUrlData 物件中
  for (i = 0; i < webUrl.length; i++) {
    // 單純 CSV 網址
    c = webUrl[i].indexOf("csv=")
    if (c != -1) {
      $(".hint-text .text").text("讀取中...");
      webUrlData.csv = webUrl[i].replace("csv=", "");
      $("#importUrl").val(webUrlData.csv);
      csvUrl = $("#importUrl").val();
      $.ajax({
        url: csvUrl,
        success: function (data) {
          importSuccess(data);
          $(".btn-import, .btn-display, .btn-instruction, .btn-about, .btn-share").css("opacity", "0");
        },
        error: function () {
          undefined
          importError();
        },
      });
    }
    // GOOGLE CSV 網址
    g = webUrl[i].indexOf("google=")
    if (g != -1) {
      $(".hint-text .text").text("讀取中...");
      webUrlData.google = webUrl[i].replace("google=", "");
      $("#importUrl").val("https://docs.google.com/spreadsheets/d/e/" + webUrlData.google + "/pub?output=csv");
      csvUrl = $("#importUrl").val();
      $.ajax({
        url: csvUrl,
        success: function (data) {
          importSuccess(data);
          $(".btn-import, .btn-display, .btn-instruction, .btn-about, .btn-share").css("opacity", "0");
        },
        error: function () {
          undefined
          importError();
        },
      });
    }
    // 標題
    t = webUrl[i].indexOf("title=")
    if (t != -1) {
      webUrlData.title = decodeURI(webUrl[i].replace("title=", ""));
    }

  }



}
analyzeUrl();


//---------------------------------------------------------------------
var csvUrl;  // CSV 連結
var csvList; // 放 CSV 資料的陣列
var csvObjectArray; // 放 CSV 資料的物件
var repeatDrawState = 0; // 重複抽獎狀態 0:不重複抽獎 1:重複抽獎

// 匯入 CSV
function importCsv() {
  $(".import-btn").click(function () {
    $(this).text("匯入中");
    csvUrl = $("#importUrl").val();
    if (csvUrl == "") {
      $("#importUrl").parent().addClass("warning");
      $(".warning-text").text("此欄位不可空白。");
      $(".warning-text").css("display", "block");
      $(this).text("確認");
    }
    else {
      $.ajax({
        url: csvUrl,
        success: function (data) {
          importSuccess(data);
          closeMenu();
          modalState = 0;
        },
        error: function () {
          undefined
          importError();
        },
      });
    }
  });
}
// 匯入成功
function importSuccess(data) {
  // 讀取 csv 資料
  csvList = $.csv.toArrays(data + "\n");
  csvObjectArray = convertListToObjectArray(csvList)

  importState = 1;
  $(".hint-text .text").text("匯入成功");
  $('#import-modal').modal('hide');
  $("#importUrl").parent().removeClass("warning");
  $(".warning-text").text("");
  $(".warning-text").css("display", "none");
  $(".btn-about").css("display", "flex");
  $(".import-btn").text("確認");
  $(".no-data-text").hide();

  // 產生分享連結
  exportUrl();

  // 列印匯入扭蛋項目
  printGachaList();

}
// 匯入失敗
function importError() {
  importState = 0;
  $("#importUrl").parent().addClass("warning");
  $(".import-btn").text("確認");
  $(".hint-text .text").text("匯入錯誤");
  $(".warning-text").text("網址匯入錯誤。");
  $(".warning-text").css("display", "block");
  $(".no-data-text").show();
}
importCsv();


//---------------------------------------------------------------------

// 列表轉換
function convertListToObjectArray(list) {
  // 獲取標題行
  const headers = list[0];

  // 創建物件陣列，跳過標題行
  const result = list.slice(1).map((item, index) => {
    const obj = {};
    // 對每一項目進行迴圈，將標題與值對應起來
    headers.forEach((header, i) => {
      obj[header] = item[i];
    });
    // 新增 itemIsDrawn 屬性：表示該項目是否被抽出
    obj["itemIsDrawn"] = false;
    // 新增 itemId 屬性：表示該項目的 id
    obj["itemId"] = `gacha-item-${index}`;
    // 新增 itemCount 屬性：表示該項目的抽出次數
    obj["itemCount"] = 0;
    return obj;
  });

  return result;
}

//---------------------------------------------------------------------
// 產生分享連結
function exportUrl() {
  port = ""
  if (location.port != "") {
    port = ":" + location.port
  }

  if (csvUrl.indexOf("https://docs.google.com/spreadsheets/d/e/") != -1) {
    // 將 google csv 去頭去尾
    x = csvUrl.replace("https://docs.google.com/spreadsheets/d/e/", "");
    x = x.split("/")[0];

    $(".share-url").val("https://" + location.hostname + port + location.pathname + "?google=" + x);
  } else {
    $(".share-url").val("https://" + location.hostname + port + location.pathname + "?csv=" + csvUrl);
  }

}

//---------------------------------------------------------------------
// 複製網址
const btnCopy = document.querySelector('.share-url-copy');
btnCopy.addEventListener('click', function () {
  const inputText = document.querySelector('.share-url');

  // pc
  inputText.select();
  // ios
  x = $(".share-url").val().length
  inputText.setSelectionRange(0, x);

  document.execCommand('copy');
});

//---------------------------------------------------------------------
// 列印匯入扭蛋項目
printGachaList();
// 列印匯入扭蛋項目清單
function printGachaList() {

  if (csvObjectArray == null) {
    $("ul.gacha-list").empty();
    $("ul.gacha-list").hide();
    $(".modal-body-display .modal-no-data").show();
    $("#display-modal-reset").hide();
  }
  else {
    $("ul.gacha-list").show();
    $(".modal-body-display .modal-no-data").hide();
    $("#display-modal-reset").css("display", "flex");
    
    console.log(csvObjectArray);
    $("ul.gacha-list").empty();
    csvObjectArray.forEach(item => {
      const key = Object.keys(item)[0];
      const li = $("<li class='item' id='" + item["itemId"] + "'><p class='item-name'>" + item[key] + "</p><p class='item-count'>" + item["itemCount"] + "</p>"+"</li>");
      if (item["itemIsDrawn"] && repeatDrawState == 0) {
        li.addClass("is-drawn");
      }
      $("ul.gacha-list").append(li);
    });
  }

  // 設定 GachaList 按鈕
  setGachaListBtnClickEvent();
}

repeatDraw();
// 重複抽獎選項
function repeatDraw() {

  // 檢查 #repeat-draw 是否被勾選
  if ($("#repeat-draw").is(":checked")) {
    console.log("重複抽獎");
    repeatDrawState = 1;
    $(".repeat-draw").addClass("checked");
    $("ul.gacha-list").addClass("repeat-draw-list");
    $("ul.gacha-list").removeClass("no-repeat-draw-list");
  } else {
    console.log("不重複抽獎");
    repeatDrawState = 0;
    $(".repeat-draw").removeClass("checked");
    $("ul.gacha-list").removeClass("repeat-draw-list");
    $("ul.gacha-list").addClass("no-repeat-draw-list");
  }

}

// 設定 GachaList 按鈕
function setGachaListBtnClickEvent() {

  $(".gacha-list .item").click(function () {
    // 取得 this id 屬性的值
    const id = $(this).attr("id");
    console.log(id);

    // 如果是不重複抽獎才執行
    if (repeatDrawState == 0) {
      if ($(this).hasClass("is-drawn")) {
        $(this).removeClass("is-drawn");
        // 清除該項目的 itemIsDrawn 狀態
        csvObjectArray.forEach(item => {
          if (item["itemId"] == id) {
            item["itemIsDrawn"] = false;
          }
        });

      }else{
        $(this).addClass("is-drawn");
        // 更新該項目的 itemIsDrawn 狀態
        csvObjectArray.forEach(item => {
          if (item["itemId"] == id) {
            item["itemIsDrawn"] = true;
          }
        });
      }
    }
  });


}

// 重置按鈕
function resetCsvObjectArray() {

  // 清除 active 樣式
  $(".gacha-list .item").removeClass("active");
  $(".gacha-list .item").removeClass("is-drawn");

  csvObjectArray.forEach(item => {
    item["itemIsDrawn"] = false;
    item["itemCount"] = 0;
  });

  printGachaList();

}