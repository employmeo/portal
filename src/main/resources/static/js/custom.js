/**
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

// Sidebar
$(function () {
    var URL = window.location,
        $BODY = $('body'),
        $SIDEBAR_MENU = $('#sidebar-menu'),
        $MENU_TOGGLE = $('#menu_toggle');
        $SIDEBAR_FOOTER = $('.sidebar-footer');
        $LEFT_COL = $('.left_col');

    $SIDEBAR_MENU.find('li ul').slideUp();
    $SIDEBAR_MENU.find('li').removeClass('active');

    $SIDEBAR_MENU.find('li').on('click', function(ev) {
        var link = $('a', this).attr('href');

        // prevent event bubbling on parent menu
        if (link) {
            ev.stopPropagation();
        } 
        // execute slidedown if parent menu
        else {
            if ($(this).is('.active')) {
                $(this).removeClass('active');
                $('ul', this).slideUp();
            } else {
                $SIDEBAR_MENU.find('li').removeClass('active');
                $SIDEBAR_MENU.find('li ul').slideUp();
                
                $(this).addClass('active');
                $('ul', this).slideDown();
            }
        }
    });

    $MENU_TOGGLE.on('click', function() {
        if ($BODY.hasClass('nav-md')) {
            $BODY.removeClass('nav-md').addClass('nav-sm');
            $LEFT_COL.removeClass('scroll-view').removeAttr('style');
            $SIDEBAR_FOOTER.hide();

            if ($SIDEBAR_MENU.find('li').hasClass('active')) {
                $SIDEBAR_MENU.find('li.active').addClass('active-sm').removeClass('active');
            }
        } else {
            $BODY.removeClass('nav-sm').addClass('nav-md');
            $SIDEBAR_FOOTER.show();

            if ($SIDEBAR_MENU.find('li').hasClass('active-sm')) {
                $SIDEBAR_MENU.find('li.active-sm').addClass('active').removeClass('active-sm');
            }
        }
    });

    // check active menu
    $SIDEBAR_MENU.find('a[href="' + URL + '"]').parent('li').addClass('current-page');
    $SIDEBAR_MENU.find('a').filter(function () {
        return this.href == URL;
    }).parent('li').addClass('current-page').parent('ul').slideDown().parent().addClass('active');
});


// Right column height
        
        
$(".right_col").css("min-height", $(window).height());
$(window).resize(function () {
    $(".right_col").css("min-height", $(window).height());
});

// Tooltip
$(function () {
    $('[data-toggle="tooltip"]').tooltip();
});

// Progressbar
if ($(".progress .progress-bar")[0]) {
    $('.progress .progress-bar').progressbar(); // bootstrap 3
}
// Close ibox function
$('.close-link').click(function () {
    var content = $(this).closest('div.x_panel');
    content.remove();
});
// Collapse ibox function
$('.collapse-link').click(function () {
    var x_panel = $(this).closest('div.x_panel');
    var button = $(this).find('i');
    var content = x_panel.find('div.x_content');
    content.slideToggle(200);
    (x_panel.hasClass('fixed_height_390') ? x_panel.toggleClass('').toggleClass('fixed_height_390') : '');
    (x_panel.hasClass('fixed_height_320') ? x_panel.toggleClass('').toggleClass('fixed_height_320') : '');
    button.toggleClass('fa-chevron-up').toggleClass('fa-chevron-down');
    setTimeout(function () {
        x_panel.resize();
    }, 50);
});
// Accordion
$(function () {
    $(".expand").on("click", function () {
        $(this).next().slideToggle(200);
        $expand = $(this).find(">:first-child");

        if ($expand.text() == "+") {
            $expand.text("-");
        } else {
            $expand.text("+");
        }
    });
});