
$("li").on("click", function () {
    highlightTab($(this).attr("value"));
    switchTab($(this).attr("value"));
});


function highlightTab(value) {
    $("li").each(function (index) {
        if ($(this).attr("value") == value) {
            $(this).css("color", "#6287ff");
        }
        else {
            $(this).css("color", "#fff");
        }
    })
}

function switchTab(value) {
    $(".table-wrapper").each(function (index) {
        if ($(this).attr("value") == value) {
            $(this).css("display", "block");
        }
        else {
            $(this).css("display", "none");
        }
    })
}
$(document).ready(function () {
  $.fn.dataTable.moment('D MMMM, HH:mm');
    // Setup - add a text input to each footer cell
var outstandingVolumeSum = 0;
var outstandingRewardSum = 0;
var outstandingCollateralSum = 0;
    $('#outstanding thead tr')
        .clone(true)
        .addClass('filters')
        .appendTo('#outstanding thead');

    var outstandingTable = $('#outstanding').DataTable({
        orderCellsTop: true,
        fixedHeader: true,
        pageLength: 100,
          order: [[2, 'asc']],
        initComplete: function () {
            var api = this.api();

            // For each column
            api
                .columns()
                .eq(0)
                .each(function (colIdx) {
                    // Set the header cell to contain the input element
                    var cell = $('.filters th').eq(
                        $(api.column(colIdx).header()).index()
                    );
                    var title = $(cell).text();
                    $(cell).html('<input type="text" placeholder="' + title + '" />');

                    // On every keypress in this input
                    $(
                        'input',
                        $('.filters th').eq($(api.column(colIdx).header()).index())
                    )
                        .off('keyup change')
                        .on('keyup change', function (e) {
                            e.stopPropagation();

                            // Get the search value
                            $(this).attr('title', $(this).val());
                            var regexr = '({search})'; //$(this).parents('th').find('select').val();

                            var cursorPosition = this.selectionStart;
                            // Search the column for that value
                            api
                                .column(colIdx)
                                .search(
                                    this.value != ''
                                        ? regexr.replace('{search}', '(((' + this.value + ')))')
                                        : '',
                                    this.value != '',
                                    this.value == ''
                                )
                                .draw();

                            $(this)
                                .focus()[0]
                                .setSelectionRange(cursorPosition, cursorPosition);
                        });
                });
        },
    });

    $('#outstanding tbody').on('click', 'tr', function () {

        var outstandingVolume = parseInt(($(this).find('td:eq(7)').last().html()).replace(/,|\sm\p{No}/gu, ''));
        var outstandingReward = parseInt(($(this).find('td:eq(8)').last().html()).replace(/,|\sISK/gu, ''));
        var outstandingCollateral = parseInt(($(this).find('td:eq(9)').last().html()).replace(/,|\sISK/gu, ''));
        if($(this).hasClass('selected')) {
           outstandingVolumeSum -= outstandingVolume;
           outstandingRewardSum -= outstandingReward;
           outstandingCollateralSum -= outstandingCollateral;
        } else {
           outstandingVolumeSum += outstandingVolume;
           outstandingRewardSum += outstandingReward;
           outstandingCollateralSum += outstandingCollateral;
        }
                            $('.outstandingVolumeSum').html((outstandingVolumeSum.toLocaleString('en-GB')) +' m<sup>3</sup>');
                            $('.outstandingRewardSum').html((outstandingRewardSum.toLocaleString('en-GB')) +' ISK');
                            $('.outstandingCollateralSum').html((outstandingCollateralSum.toLocaleString('en-GB')) +' ISK');
         $(this).toggleClass('selected');
    } );
// Added new section for finished table
$('#finished').DataTable({
pageLength: 25,
orderCellsTop: true,
fixedHeader: true
});
$('#cancelled').DataTable({
pageLength: 10,
orderCellsTop: true,
fixedHeader: true
});

});
