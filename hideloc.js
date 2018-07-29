var epoch = 0;

var formatNumber = function(num){
    var numStr = num.toString();
    var res = "";
    for(var i=0;i<numStr.length;i++){
        res += numStr[i];
        var pos = numStr.length - i;
        if(pos!=1 && pos%3==1) res += ',';
    }
    return res;
}

var prViewUpdate = function(diffBar, fileElement, filePlus, fileMinus){
    return function(e){
        var diffBarPlusElement = diffBar.querySelector(".text-green");
        var diffBarMinusElement = diffBar.querySelector(".text-red");

        var diffBarPlus = parseInt(diffBarPlusElement.innerHTML.trim().replace("+","").replace(",",""));
        var diffBarMinus = parseInt(diffBarMinusElement.innerHTML.trim().replace("−","").replace(",",""));
        if(fileElement.className.match("hideloc-disabled")){
            fileElement.className = fileElement.className.replace(/hideloc-disabled/g, "hideloc-enabled");
            diffBarPlus -= filePlus;
            diffBarMinus -= fileMinus;
        } else{
            fileElement.className = fileElement.className.replace(/hideloc-enabled/g, "hideloc-disabled");
            diffBarPlus += filePlus;
            diffBarMinus += fileMinus;
        }

        diffBarPlusElement.innerHTML = "+"+formatNumber(diffBarPlus);
        diffBarMinusElement.innerHTML = "−"+formatNumber(diffBarMinus);
    }
}

var commitViewUpdate = function(diffBar, fileElement, filePlus, fileMinus){
    return function(e){
        var diffBarNumFilesElement = diffBar.querySelector(".btn-link");
        var diffBarElements = diffBar.querySelectorAll("strong");
        if(!(diffBarNumFilesElement && diffBarElements.length == 2)) return;
        var diffBarPlusElement = diffBarElements[0];
        var diffBarMinusElement = diffBarElements[1];

        var matchNumFiles = new RegExp("([0-9,]+) changed files{0,1}").exec(diffBarNumFilesElement.innerHTML.trim());
        var matchPlus = new RegExp("([0-9,]+) additions{0,1}").exec(diffBarPlusElement.innerHTML.trim());
        var matchMinus = new RegExp("([0-9,]+) deletions{0,1}").exec(diffBarMinusElement.innerHTML.trim());

        if(!(matchNumFiles && matchPlus && matchMinus)) return;
        var diffBarNumFiles = parseInt(matchNumFiles[1].replace(",",""));
        var diffBarPlus = parseInt(matchPlus[1].replace(",",""));
        var diffBarMinus = parseInt(matchMinus[1].replace(",",""));

        if(fileElement.className.match("hideloc-disabled")){
            fileElement.className = fileElement.className.replace(/hideloc-disabled/g, "hideloc-enabled");
            diffBarNumFiles--;
            diffBarPlus -= filePlus;
            diffBarMinus -= fileMinus;
        } else{
            fileElement.className = fileElement.className.replace(/hideloc-enabled/g, "hideloc-disabled");
            diffBarNumFiles++;
            diffBarPlus += filePlus;
            diffBarMinus += fileMinus;
        }

        diffBarNumFilesElement.innerHTML = formatNumber(diffBarNumFiles)+" changed file"+(diffBarNumFiles!=1?"s":"");
        diffBarPlusElement.innerHTML = formatNumber(diffBarPlus)+" addition"+(diffBarPlus!=1?"s":"");
        diffBarMinusElement.innerHTML = formatNumber(diffBarMinus)+" deletion"+(diffBarMinus!=1?"s":"");
    }
}

var watchView = function(viewType, diffBar, myepoch, forceUpdate){
    if(epoch > myepoch) return;

    var elements = document.getElementsByClassName('file-info');
    for(var i=0;i<elements.length;i++){
        var fileInfo = elements[i];
        var diffStat = fileInfo.querySelector(".diffstat");
        var hideLoc = fileInfo.querySelector(".hideloc");
        if(diffStat && (!hideLoc || forceUpdate)){
            if(forceUpdate && hideLoc)
                hideLoc.parentNode.removeChild(hideLoc);

            var diffString = diffStat.getAttribute("aria-label").trim();
            var regex = new RegExp("([0-9,]+) additions{0,1} & ([0-9,]+) deletions{0,1}");
            var match = regex.exec(diffString);
            if(match){
                var filePlus = parseInt(match[1].replace(",",""));
                var fileMinus = parseInt(match[2].replace(",",""));
                var fileElement = document.createElement("i");
                fileElement.className = "hideloc icon-eye-off hideloc-disabled";
                fileElement.setAttribute("title","Hide file from lines of code count");
                if(viewType=='pr')
                    fileElement.addEventListener("click", prViewUpdate(diffBar, fileElement, filePlus, fileMinus));
                else if(viewType=='commit')
                    fileElement.addEventListener("click", commitViewUpdate(diffBar, fileElement, filePlus, fileMinus));
                fileInfo.insertBefore(fileElement, diffStat);
            }
        }
    }
    setTimeout(function(){
        watchView(viewType, diffBar, myepoch, false);
    }, 2500);
}

var updatePage = function(){
    var prView = document.location.href.match("/pull/");
    var commitView = document.location.href.match("/commit/");
    if(prView){
        var elements = document.getElementsByClassName("diffbar-item diffstat");
        if(elements.length!=1) return;
        watchView('pr',elements[0], epoch, true);
    } else if(commitView){
        var elements = document.getElementsByClassName("toc-diff-stats");
        if(elements.length!=1) return;
        watchView('commit',elements[0], epoch, true);
    }
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.message === 'page_changed')
          updatePage();
      else if(request.message === 'url_changed')
          epoch++;
    }
);