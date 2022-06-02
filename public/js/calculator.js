
$(".loading").hide();
$(".parse-status").hide();


var source = "", destination = "";


$("body").on("input", "#start", function () {
    const name = $(this).val().toString().trim().toLowerCase();
    if (name.length >= 3) {
        $.get("/system/search/" + name, (data) => {
            results = ""
            data.forEach((system) => {
                results += "<div class='result start-result' name='" + system.name + "' id='" + system.id + "' >" + system.name + " ( " + system.security + " )</div>";
            })
            $(".calculator .start .search-results").html(results);
        });
    }
    else {
        $(".calculator .start .search-results").html("");
    }
});


$("body").on("click", ".start-result", function () {
    $(".calculator .start .search-results").html("");
    $("#start").val($(this).attr("name"));
    source = $(this).attr("id");
});


$("body").on("input", "#finish", function () {
    const name = $(this).val().toString().trim().toLowerCase();
    if (name.length >= 3) {
        $.get("/system/search/" + name, (data) => {
            results = ""
            data.forEach((system) => {
                results += "<div class='result finish-result' name='" + system.name + "' id='" + system.id + "' >" + system.name + " ( " + system.security + " )</div>";
            })
            $(".calculator .finish .search-results").html(results);
        });
    }
    else {
        $(".calculator .finish .search-results").html("");
    }
});


$("body").on("click", ".finish-result", function () {
    $(".calculator .finish .search-results").html("");
    $("#finish").val($(this).attr("name"));
    destination = $(this).attr("id");
});


function clearStuff() {
    $("#item-list").val("");
    $("input").val("");
    $("input").prop('checked', false);
    $(".search-results").html("");
    resetOutputFields();

}

function submit() {
    if (source == destination) {
        alert("Source and destination system cannot be the same");
        return;
    }
    if (source.length == 0 || destination.length == 0) {
        alert("Select a source and destination system");
    }
    const isRush = $("#rush").is(":checked");
    const itemList = $("#item-list").val();
    const additionalVolume = parseInt($("#additional-volume").val());
    const additionalCollateral = parseInt($("#additional-collateral").val());

    isLoading(true);

    //setTimeout(function(){isLoading(false,"An unknown error occured");},5000);


    $.post("/", { source, destination, isRush, itemList, additionalVolume, additionalCollateral }, (data) => {
        isLoading(false);
        if (data.err) {
            $(".parse-status").addClass("error");
            $(".parse-status").html("ERROR : " + data.err);
            $(".parse-status").show();
            resetOutputFields();
            return;
        }
        else if (data.price == 0 && data.volume == 0) {
            $(".parse-status").addClass("error");
            $(".parse-status").html("ERROR : No Items appraised");
            $(".parse-status").show();
            resetOutputFields();
            return;
        }

        else if (data.errorLines.length > 0) {
            $(".parse-status").html("SOME LINES HAVE ERRORS <br><br> THE ERRORS ARE:");
            $(".parse-status").addClass("error");
            $(".parse-status").show();
            let errorLinesToAdd = "";
            data.errorLines.split("\n").forEach(function (line) {
                console.log(line);
                errorLinesToAdd += ("<li>" + line + "</li>");
            });
            $(".parse-status").append("<ul>" + errorLinesToAdd + "</ul>");
            resetOutputFields();
            return;
        }
        $(".parse-status").html("SUCCESSFUL");
        $(".parse-status").removeClass("error");
        $(".parse-status").show();

        const { sourceName, destinationName, jumpCount, price, collateral, volume, serviceCharges } = data;
        $("#ship-from").html(sourceName);
        $("#ship-to").html(destinationName);
        $("#price").html(price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " ISK");
        $("#collateral").html(collateral.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " ISK");
        $("#volume").html(parseInt(volume).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " m<sup>3</sup>");
        $("#jump-count").html(jumpCount);
        let bestServiceType;
        if (isRush) {
            $("#rush-status").html("Yes");
        }
        else {
            $("#rush-status").html("No");
        }
        if (data.lowestSec < 0.0) {
            data.lowestSec = 0.0
        }
        $("#lowest-sec").html(parseFloat(data.lowestSec).toFixed(1));
        $("#service-type").html(bestServiceType);
        $("#service-price").html(price + " ISK");
          if (isRush) {
            $("#expiration").html("1 day");
            $("#days-to-complete").html("1 day");
          }
          else {
              $("#expiration").html("7 days");
              $("#days-to-complete").html("3 days");
          }

        // if (data.serviceCharges.length == 0) {
        //     $(".parse-status").html("No route found matching the volume size");
        //     $(".parse-status").addClass("error");
        //     $(".parse-status").show();
        //     resetOutputFields();
        //     $("#service-type").html("No Service Available");
        //     $("#service-price").html("-");
        //     return;
        // }
        // else {
        //
        //     bestServiceType = "";
        //     let lowestPrice = Infinity;
        //
        //     serviceCharges.forEach(service => {
        //         if (service.price < lowestPrice) {
        //             lowestPrice = service.price;
        //             bestServiceType = service.name;
        //         }
        //     });
        //
        //     lowestPrice = Math.round((lowestPrice)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        //
        //     $("#service-type").html(bestServiceType);
        //     $("#service-price").html(lowestPrice + " ISK");
        //
        //     if (isRush) {
        //         $("#expiration").html("1 day");
        //         $("#days-to-complete").html("1 day");
        //     }
        //     else {
        //         $("#expiration").html("7 days");
        //         $("#days-to-complete").html("3 days");
        //     }
        // }
        let shipmentType = isRush ? "R" : "S"
        $("#description").html(bestServiceType + "-" + shipmentType + "-" + data.saved.key);
    });
}


function isLoading(loading,err) {
    if (loading) {
        $(".loading").show();
    }
    else {
        $(".loading").hide();
        if(err){
        $(".parse-status").html(err);
        $(".parse-status").addClass("error");
        $(".parse-status").show();
        }
        else{
            $(".parse-status").hide();
        }
    }
}




function resetOutputFields() {
    $("#ship-from").html("-");
    $("#ship-to").html("-");
    $("#price").html("-");
    $("#collateral").html("-");
    $("#volume").html("-");
    $("#jump-count").html("-");
    $("#rush-status").html("-");
    $("#lowest-sec").html("-");
    $("#service-type").html("-");
    $("#service-price").html("-");
    $("#expiration").html("-");
    $("#days-to-complete").html("-");
    $("#description").html("-")
}
