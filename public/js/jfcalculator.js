
$(".loading").hide();
$(".parse-status").hide();
$(".error-lines").hide();

function clearStuff() {
    $("#item-list").val("");
    $("select").val("");
    $("#item-list").val("");
    $("input").val("");
    $("input").prop('checked', false);
    $('.select2-search').val(null).trigger('change');
    var div = document.getElementById('destination');
    div.style.display='none';
    $("#route-price").html("-");
}

function submit() {

    const routeID = $("#finish").val();
    if (!routeID) {
        $(".parse-status").html("ERROR : " + "Destination not set");
        $(".parse-status").addClass("error");
        $(".parse-status").show();
        return;
    }
    const isRush = $("#rush").is(":checked");
    const itemList = $("#item-list").val();
    const additionalVolume = parseInt($("#additional-volume").val());
    const additionalCollateral = parseInt($("#additional-collateral").val());

    isLoading(true);

    const data = { routeID, isRush, itemList, additionalVolume, additionalCollateral };

    $.post("/jf", data, (response) => {
        isLoading(false);
        if (response.err) {
            $(".parse-status").html("ERROR : " + response.err);
            $(".parse-status").addClass("error");
            $(".parse-status").show();
            resetOutputFields();
            return;
        }
        else if (response.price == 0 && response.volume == 0) {
            $(".parse-status").addClass("error");
            $(".parse-status").html("ERROR : No Items appraised");
            $(".parse-status").show();
            resetOutputFields();
            return;
        }
        else if (response.errorLines.length > 0) {
            $(".parse-status").html("SOME LINES HAVE ERRORS <br><br> THE ERRORS ARE:");
            $(".parse-status").addClass("error");
            $(".parse-status").show();
            let errorLinesToAdd = "";
            response.errorLines.split("\n").forEach(function (line) {
                console.log(line);
                errorLinesToAdd += ("<li>" + line + "</li>");
            });
            $(".parse-status").append("<ul>" + errorLinesToAdd + "</ul>");
            resetOutputFields();
            return;
        }
        else {
            $(".parse-status").html("SUCCESSFUL");
            $(".parse-status").removeClass("error");
            $(".parse-status").show();
            $("#ship-from").html(response.route.start);
            $("#ship-to").html(response.route.destination);
            $("#service-type").html(response.servicePricing);
            $("#rush-status").html(isRush ? "Yes" : "No");
            $("#reward").html(response.reward.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " ISK");
            $("#collateral").html(response.collateral.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " ISK");
            $("#volume").html(response.volume.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " m<sup>3</sup>");
            $("#price").html(response.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " ISK");

            let shipmentType = isRush ? "R" : "S"
            $("#description").html("Jump Freighter" + "-" + shipmentType + "-" + response.saved.key);

            if (isRush) {
                $("#expiration").html("1 day");
                $("#days-to-complete").html("1 day");
            }
            else {
                $("#expiration").html("7 days");
                $("#days-to-complete").html("3 days");
            }
        }




    });


}

function isLoading(loading) {
    if (loading) {
        $(".loading").show();
    }
    else {
        $(".loading").hide();
    }
}

function getRouteDetails(id) {
    return new Promise(function (resolve, reject) {
        $.post("/routes/get/name", { id }, response => {
            if (response.err) {
                alert("Error" + JSON.stringify(response.err));
                reject(response.err);
            }
            else {
                resolve(response);
                // $("#max-volume").html(response.maxVolume.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " m<sup>3</sup>");
                // $("#max-collateral").html(response.maxCollateral.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " ISK");
            }
        });
    })

}

$(document).ready(function() {
    $('.select2-search').select2({dropdownAutoWidth : true, placeholder: "--"});
});

$("#start").on("change", async function () {
  console.log($(this).val());
if ($(this).val() != null) {
  var div = document.getElementById('destination');

    const routes = await getRouteDetails($(this).val().toString());
    $("#finish").html("<option hidden disabled selected value> -- </option>");
    routes.forEach(route => {
        let selection = '<option value=' + route._id + '>' + route.destination + '</option>';
        $("#finish").append(selection);
    });

    div.style.display='inline-block';
    }
})

$("#finish").on("change", async function () {
    const id = $("#finish").val();
    if ($(this).val() != null) {
    $.post("/routes/get", { id }, response => {
        if (response.err) {
            alert("Error" + JSON.stringify(response.err));
        }
        else {
            console.log(response);
            $("#max-volume").html(response[0].maxVolume.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " m<sup>3</sup>");
            $("#max-collateral").html(response[0].maxCollateral.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " ISK");
            $("#min-reward").html(response[0].minReward.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " ISK");
            if (response[0].isFlat) {
                $("#route-price").html(response[0].flatPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " ISK");
            }
            else {
                $("#route-price").html(response[0].price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " ISK/m<sup>3</sup>");
            }
            if (response[0].isRush) {
                $("#route-rush").html("Available");
                $("#route-rush-charge").html(response[0].rushShippingCharge.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " ISK");

            }
            else {
                $("#route-rush").html("N/A");
                $("#route-rush-charge").html("- ISK");

            }

        }
    });
}})




function resetOutputFields() {
    $("#ship-from").html("-");
    $("#ship-to").html("-");
    $("#reward").html("-");
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
