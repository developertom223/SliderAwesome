/*<=== SliderAwesome.jquery.js ===>*/

/* 
 * version 1.0.0
 * improved by Geolage
 * last edit: 2017.9.15
 * https://github.com/Geolage/SliderAwesome
 * welcome more commits !
 */

(function ($) {
    var SliderAwesome = function (element, options) {
        // Add effect validation
        try {
            var _effect = options.effect,
                _styles = $.fn.sliderAwesome.defaults.styles,
                type = Object.prototype.toString.call(_effect).slice(8, -1);
            if (type === 'String' || type === 'Array') {
                if (type === 'String') {
                    if (!_effect.trim().length) {
                        options.effect = 'default';
                        throw new Error('Effect is empty ! Now has been automatically reset to "default" !');
                    }
                    if (_effect !== 'default' && _effect !== 'random' && _styles.indexOf(_effect) === -1) {
                        options.effect = 'default';
                        throw new Error('Cannot find effect "' + _effect + '", now automatically reset to "default" !');
                    }
                } else {
                    var _arr = _effect.slice();
                    if (_arr.length) {
                        $.each(_arr, function (i, e) {
                            if (_styles.indexOf(e) === -1) {
                                if (e === 'default' && _arr.length === 1) {
                                    options.effect = 'default';
                                    return false;
                                }
                                _effect.splice(i, 1);
                                console.log('Invalid effect "' + e + '" has been abandoned !');
                                if (e === 'default') {
                                    console.log('Please do not type "default" into effects list [Array] !');
                                }
                                if (e === 'random') {
                                    console.log('Please just type "random" as a [String] if needed !');
                                }
                            }
                        });
                    } else {
                        throw new Error('The effect list: [] is empty !');
                    }
                    if (!_effect.length) {
                        options.effect = 'default';
                        throw new Error('Cannot find effect at this list: ["' + _arr.join('","') + '"] , now has been automatically reset to "default" !');
                    }
                }
            } else {
                options.effect = 'default';
                throw new Error('TypeError at "effect":"' + _effect + '", now has been automatically reset to "default" !');
            }
        } catch (e) {
            console.log(e);
        }

        var settings = $.extend({}, $.fn.sliderAwesome.defaults, options);

        // Useful variables
        var vars = {
            currentSlide: 0,
            currentImage: '',
            currentEffect: '',
            totalSlides: 0,
            running: false,
            paused: false,
            actionPause: false,
            stop: false,
            indicator: false
        };

        // Get and initialize slider
        var slider = $(element);
        slider.data('sa:vars', vars);

        // Add slider elements checkout
        try {
            var ul = slider.toggleClass('sa', true).toggleClass('sa-slider-' + settings.effect, true).find('ul').has('li img');
            if (ul.length) {
                if (!ul.hasClass('slider-list')) {
                    ul.eq(0).addClass('slider-list');
                }
            } else {
                throw new Error('Cannot find slider-list !')
            }
        } catch (e) {
            console.log(e);
        }

        // Get css duration in defaultRun transition
        var duration = $('.slider-list>li', slider).css('transition').split(' ')[1].slice(0, -1) * 1000;

        // Find slider children
        var imgs = slider.find('.slider-list li').children('img');
        var imgWidth_temp = 0,
            imgHeight_temp = 0;
        imgs.each(function (i) {
            var img = $(this);
            var link = '';
            if (!img.is('img')) {
                if (img.is('a')) {
                    img.addClass('sa-imageLink');
                    link = img;
                }
                img = img.find('img:first');
            }

            // Get img width & height
            var imgWidth = img.get(0).width,
                imgHeight = img.get(0).height;
            if (imgWidth !== imgWidth_temp || imgHeight !== imgHeight_temp) {
                slider.css({
                    width: imgWidth + 'px',
                    height: imgHeight + 'px'
                });
                imgWidth_temp = imgWidth;
                imgHeight_temp = imgHeight;
            }
            if (settings.effect !== 'default') {
                if (link !== '') {
                    link.css('display', 'none');
                }
                img.css('display', 'none');
            }
            vars.totalSlides++;
        });

        // If randomStart
        if (settings.randomStart) {
            settings.startSlide = Math.floor(Math.random() * vars.totalSlides);
        }

        // Set startSlide
        if (settings.startSlide > 0) {
            if (settings.startSlide >= vars.totalSlides) {
                settings.startSlide = vars.totalSlides - 1;
            }
            vars.currentSlide = settings.startSlide;
        }
        // Get initial image
        if ($(imgs[vars.currentSlide]).is('img')) {
            vars.currentImage = $(imgs[vars.currentSlide]);
        } else {
            vars.currentImage = $(imgs[vars.currentSlide]).find('img:first');
        }

        // Show initial link
        if ($(imgs[vars.currentSlide]).is('a')) {
            $(imgs[vars.currentSlide]).css('display', 'block');
        }

        // Set first background
        var sliderImg;
        if (settings.effect === 'default') {
            vars.currentImage.parent().addClass('active').siblings().removeClass('active');
        } else {
            sliderImg = $('<img/>').addClass('sa-main-image');
            sliderImg.attr('src', vars.currentImage.attr('src')).show();
            slider.append(sliderImg);
        }

        // Detect Window Resize
        $(window).resize(function () {
            slider.children('img').width(slider.width());
            if (sliderImg.length) {
                sliderImg.attr('src', vars.currentImage.attr('src'));
                sliderImg.stop().height('auto');
            }
            $('.sa-img-slice').remove();
            $('.sa-img-box').remove();
        });

        //Create caption
        slider.append($('<div class="sa-caption"></div>'));

        // Process caption function
        var processCaption = function (settings) {
            var saCaption = $('.sa-caption', slider);
            if (vars.currentImage.attr('title') != '' && vars.currentImage.attr('title') != undefined) {
                var title = vars.currentImage.attr('title');
                if (title.substr(0, 1) == '#') title = $(title).html();

                if (saCaption.css('display') == 'block') {
                    setTimeout(function () {
                        saCaption.html(title);
                    }, settings.speed);
                } else {
                    saCaption.html(title);
                    saCaption.stop().fadeIn(settings.speed);
                }
            } else {
                saCaption.stop().fadeOut(settings.speed);
            }
        }

        //Process initial  caption
        processCaption(settings);

        // Timer initials
        var timer = 0;
        if (!settings.manualAdvance && imgs.length > 1) {
            if (settings.effect === 'default') {
                timer = setInterval(function () {
                    defaultRun(slider, 'slideToLeft');
                }, settings.delay + duration);
            } else {
                effectSetter('Right');
                timer = setInterval(function () {
                    effectRun(slider, imgs, settings, false);
                }, settings.delay + duration);
            }
        }

        // Add effect setter
        function effectSetter(direction) {
            switch (settings.effect) {
                case 'flickrSlices':
                    {
                        vars.currentEffect = 'flickrSlices' + direction;
                        break;
                    }
                case 'flickrWiderSlices':
                    {
                        vars.currentEffect = 'flickrWiderSlices' + direction;
                        break;
                    }
                case 'scroll':
                    {
                        vars.currentEffect = 'scroll' + direction;
                        break;
                    }
                case 'shutters':
                    {
                        vars.currentEffect = 'shutters' + direction;
                        break;
                    }
                case 'shuffle':
                    {
                        vars.currentEffect = 'shuffle' + direction;
                        break;
                    }
                case 'takeOut':
                    {
                        vars.currentEffect = 'takeOut' + direction;
                        break;
                    }
                case 'shuffleAndTakeOut':
                    {
                        vars.currentEffect = direction === 'Left' ? 'shuffleRight' : 'takeOutRight';
                        break;
                    }
                case 'boxesRain':
                    {
                        vars.currentEffect = 'boxesRain' + direction;
                        break;
                    }
                case 'flickrGridsUp':
                    {
                        vars.currentEffect = 'flickrGridsUp' + direction;
                        break;
                    }
                case 'gridsShuffleUp':
                    {
                        vars.currentEffect = 'gridsShuffleUp' + direction;
                        break;
                    }
            }
        }

        // Activate keyboard nav
        if (settings.keyboardNav) {
            var code_arr = [];
            $(window).on({
                keydown: function (e) {
                    var code = e.keycode || e.which;
                    if (code_arr.indexOf(code) == -1) {
                        code_arr.push(code)
                    };
                    if (code_arr.length > 1) {
                        return false
                    };
                    switch (code_arr[0]) {
                        case 37:
                            {
                                if (vars.actionPause) {
                                    return false;
                                }
                                vars.actionPause = true;
                                setTimeout(function () {
                                    vars.actionPause = false;
                                }, duration + 20);
                                if (vars.running) {
                                    return false;
                                }
                                clearInterval(timer);
                                timer = '';
                                if (settings.effect === 'default') {
                                    defaultRun(slider, 'slideToRight');
                                } else {
                                    effectSetter('Left');
                                    vars.currentSlide -= 2;
                                    effectRun(slider, imgs, settings, 'pre');
                                }
                                break;
                            }
                        case 39:
                            {
                                if (vars.actionPause) {
                                    return false;
                                }
                                vars.actionPause = true;
                                setTimeout(function () {
                                    vars.actionPause = false;
                                }, duration + 20);
                                if (vars.running) {
                                    return false;
                                };
                                clearInterval(timer);
                                timer = '';
                                if (settings.effect === 'default') {
                                    defaultRun(slider, 'slideToLeft');
                                } else {
                                    effectSetter('Right');
                                    effectRun(slider, imgs, settings, 'next');
                                }
                                break;
                            }
                    }
                },
                keyup: function (e) {
                    var i = code_arr.indexOf(e.keycode || e.which);
                    if (i != -1) {
                        code_arr.splice(i, 1)
                    };
                }
            }, slider);
        }

        // Add Direction nav
        if (settings.clickNav) {
            slider.append('<a class="sa-control-pre"> < </a>' + '<a class="sa-control-next"> > </a>');

            // bind click events
            $(slider).on('click', '.sa-control-pre', function (e) {
                if (document.all) {
                    window.event.returnValue = false;
                } else {
                    e.preventDefault();
                }
                if (vars.actionPause) {
                    return false;
                }
                vars.actionPause = true;
                pause = setTimeout(function () {
                    vars.actionPause = false;
                }, duration + 20);
                if (vars.actionPause && vars.running) {
                    return false;
                }
                clearInterval(timer);
                timer = '';

                // set styles of every click
                if (settings.effect === 'default') {
                    defaultRun(slider, 'slideToRight');
                } else {
                    effectSetter('Left');
                    vars.currentSlide -= 2;
                    effectRun(slider, imgs, settings, 'pre');
                }

            });

            $(slider).on('click', '.sa-control-next', function (e) {
                if (document.all) {
                    window.event.returnValue = false;
                } else {
                    e.preventDefault();
                }
                if (vars.actionPause) {
                    return false;
                }
                vars.actionPause = true;
                pause = setTimeout(function () {
                    vars.actionPause = false;
                }, duration + 20);
                if (vars.actionPause && vars.running) {
                    return false;
                }
                clearInterval(timer);
                timer = '';
                if (settings.effect === 'default') {
                    defaultRun(slider, 'slideToLeft');
                } else {
                    effectSetter('Right');
                    effectRun(slider, imgs, settings, 'next');
                }
            });
            $(slider).on({
                click: function () {
                    $(slider, '[class*="sa-control"]').attr('onselectstart', 'return false');
                },
                dblclick: function (e) {
                    if (document.all) {
                        window.event.returnValue = false;
                    } else {
                        e.preventDefault();
                    }
                }
            }, '.sa-control-pre,.sa-control-next');
        }

        // Add indicator
        if (settings.indicator) {
            vars.indicator = $('<div class="sa-indicator"></div>');
            slider.after(vars.indicator);

            // unfinished !
            for (var i = 0; i < imgs.length; i++) {
                if (settings.indicatorThumbs) {
                    vars.indicator.addClass('sa-thumbs-enabled');
                    var img = imgs.eq(i);
                    if (!img.is('img')) {
                        img = img.find('img:first');
                    }
                    if (img.attr('data-thumb')) vars.indicator.append('<a rel="' + i + '"><img src="' + img.attr('data-thumb') + '" alt="" /></a>');
                } else {
                    vars.indicator.append('<a rel="' + i + '">' + (i + 1) + '</a>');
                }
            }

            //Set initial active link
            $('a:eq(' + vars.currentSlide + ')', vars.indicator).addClass('active');

            $('a', vars.indicator).bind('click', function () {
                if (vars.running) return false;
                if ($(this).hasClass('active')) return false;
                clearInterval(timer);
                timer = '';
                sliderImg.attr('src', vars.currentImage.attr('src'));
                vars.currentSlide = $(this).attr('rel') - 1;
                effectRun(slider, imgs, settings, 'control');
            });
        }

        //For pauseOnHover setting
        if (settings.pauseOnHover) {
            slider.on({
                mouseover: function () {
                    vars.paused = true;
                    clearInterval(timer);
                    timer = '';
                },
                mouseout: function () {
                    vars.paused = false;
                    // Restart the timer
                    if (timer === '' && !settings.manualAdvance) {
                        if (settings.effect === 'default') {
                            timer = setInterval(function () {
                                defaultRun(slider, 'slideToLeft')
                            }, settings.delay + duration);
                        } else {
                            timer = setInterval(function () {
                                effectRun(slider, imgs, settings, false);
                            }, settings.delay + duration);
                        }
                    }
                }
            }, '.slider-list li img,.sa-main-image,div[class*="sa-img-"]>img');
        }

        // Event when Animation finishes
        slider.bind('sa:animFinished', function () {
            vars.running = false;
            // Hide img links
            if (settings.effect !== 'default') {
                sliderImg.attr('src', vars.currentImage.attr('src'));
                $(imgs).each(function () {
                    if ($(this).is('a')) {
                        $(this).css('display', 'none');
                    }
                });
            }
            // Show current link
            if ($(imgs[vars.currentSlide]).is('a')) {
                $(imgs[vars.currentSlide]).css('display', 'block');
            }
            // Restart the timer
            if (timer === '' && !vars.paused && !settings.manualAdvance) {
                if (settings.effect === 'default') {
                    timer = setInterval(function () {
                        defaultRun(slider, 'slideToLeft')
                    }, settings.delay + duration)
                } else {
                    timer = setInterval(function () {
                        effectRun(slider, imgs, settings, false);
                    }, settings.delay + duration);
                }
            }
            // Trigger the afterChange callback
            settings.afterChange.call(this);
        });

        // Add slices for slice animations
        var createSlices = function (slider, settings, vars) {
            if ($(vars.currentImage).parent().is('a')) $(vars.currentImage).parent().css('display', 'block');
            $('img[src="' + vars.currentImage.attr('src') + '"]', slider).not('.sa-main-image,[class*="sa-control"] img').width(slider.width()).css('visibility', 'hidden').show();
            var sliceHeight = ($('img[src="' + vars.currentImage.attr('src') + '"]', slider).not('.sa-main-image,[class*="sa-control"] img').parent().is('a')) ? $('img[src="' + vars.currentImage.attr('src') + '"]', slider).not('.sa-main-image,[class*="sa-control"] img').parent().height() : $('img[src="' + vars.currentImage.attr('src') + '"]', slider).not('.sa-main-image,[class*="sa-control"] img').height();

            for (var i = 0; i < settings.slices; i++) {
                var sliceWidth = Math.round(slider.width() / settings.slices);

                if (i === settings.slices - 1) {
                    slider.append(
                        $('<div class="sa-img-slice" name="' + i + '"><img src="' + vars.currentImage.attr('src') + '" style="position:absolute; width:' + slider.width() + 'px; height:auto; display:block !important; top:0; left:-' + ((sliceWidth + (i * sliceWidth)) - sliceWidth) + 'px;" /></div>').css({
                            left: (sliceWidth * i) + 'px',
                            width: (slider.width() - (sliceWidth * i)) + 'px',
                            height: sliceHeight + 'px',
                            opacity: '0',
                            overflow: 'hidden'
                        })
                    );
                } else {
                    slider.append(
                        $('<div class="sa-img-slice" name="' + i + '"><img src="' + vars.currentImage.attr('src') + '" style="position:absolute; width:' + slider.width() + 'px; height:auto; display:block !important; top:0; left:-' + ((sliceWidth + (i * sliceWidth)) - sliceWidth) + 'px;" /></div>').css({
                            left: (sliceWidth * i) + 'px',
                            width: sliceWidth + 'px',
                            height: sliceHeight + 'px',
                            opacity: '0',
                            overflow: 'hidden'
                        })
                    );
                }
            }

            $('.sa-img-slice', slider).height(sliceHeight);
            sliderImg.stop().animate({
                height: $(vars.currentImage).height()
            }, settings.speed);
        };

        // Add boxes for box animations
        var createBoxes = function (slider, settings, vars) {
            if ($(vars.currentImage).parent().is('a')) $(vars.currentImage).parent().css('display', 'block');
            $('img[src="' + vars.currentImage.attr('src') + '"]', slider).not('.sa-main-image,[class*="sa-control"] img').width(slider.width()).css('visibility', 'hidden').show();
            var boxWidth = Math.round(slider.width() / settings.boxCols),
                boxHeight = Math.round($('img[src="' + vars.currentImage.attr('src') + '"]', slider).not('.sa-main-image,[class*="sa-control"] img').height() / settings.boxRows);


            for (var rows = 0; rows < settings.boxRows; rows++) {
                for (var cols = 0; cols < settings.boxCols; cols++) {
                    if (cols === settings.boxCols - 1) {
                        slider.append(
                            $('<div class="sa-img-box" name="' + cols + '" rel="' + rows + '"><img src="' + vars.currentImage.attr('src') + '" style="position:absolute; width:' + slider.width() + 'px; height:auto; display:block; top:-' + (boxHeight * rows) + 'px; left:-' + (boxWidth * cols) + 'px;" /></div>').css({
                                opacity: 0,
                                left: (boxWidth * cols) + 'px',
                                top: (boxHeight * rows) + 'px',
                                width: (slider.width() - (boxWidth * cols)) + 'px'

                            })
                        );
                        $('.sa-img-box[name="' + cols + '"]', slider).height($('.sa-img-box[name="' + cols + '"] img', slider).height() + 'px');
                    } else {
                        slider.append(
                            $('<div class="sa-img-box" name="' + cols + '" rel="' + rows + '"><img src="' + vars.currentImage.attr('src') + '" style="position:absolute; width:' + slider.width() + 'px; height:auto; display:block; top:-' + (boxHeight * rows) + 'px; left:-' + (boxWidth * cols) + 'px;" /></div>').css({
                                opacity: 0,
                                left: (boxWidth * cols) + 'px',
                                top: (boxHeight * rows) + 'px',
                                width: boxWidth + 'px'
                            })
                        );
                        $('.sa-img-box[name="' + cols + '"]', slider).height($('.sa-img-box[name="' + cols + '"] img', slider).height() + 'px');
                    }
                }
            }

            sliderImg.stop().animate({
                height: $(vars.currentImage).height()
            }, settings.speed);
        };

        var defaultRun = function (slider, style) {
            var $elem = slider;
            $elem.find('img.sa-main-image').remove();
            var duration = settings.speed + 100;
            $('.slider-list>li', slider).css('transition', 'all ' + duration / 1000 + 's ease-in-out');
            var $active = $elem.find('.slider-list li.active');
            switch (style) {
                case 'slideToLeft':
                    {
                        if ($active.css('left') != '0px') return;
                        var $next = $active.next('li').length ? $active.next('li') : $active.siblings('li').first();
                        $next.attr('class', 'next');
                        setTimeout(function () {
                            $active.addClass('left');
                            $next.addClass('left');
                            setTimeout(function () {
                                $elem.find('.slider-list>li.active').removeAttr('class');
                                $next.attr('class', 'active');
                                setTimeout(function () {
                                    slider.trigger('sa:animFinished');
                                }, 150);
                            }, duration + 20);
                        }, 1);
                        break;
                    }
                case 'slideToRight':
                    {
                        if ($active.css('left') != '0px') return;
                        var $pre = $active.prev('li').length ? $active.prev('li') : $active.siblings('li').last();
                        $pre.attr('class', 'pre');
                        setTimeout(function () {
                            $active.addClass('right');
                            $('.slider-list>li.pre').addClass('right');
                            setTimeout(function () {
                                $elem.find('.slider-list>li.active').removeAttr('class');
                                $pre.attr('class', 'active');
                                setTimeout(function () {
                                    slider.trigger('sa:animFinished');
                                }, 150);
                            }, duration + 20);
                        }, 1);
                        break;
                    }
            }
        }

        // Private run method
        var effectRun = function (slider, imgs, settings, control) {
            var vars = slider.data('sa:vars');

            // Trigger the lastSlide callback
            if (vars && (vars.currentSlide === vars.totalSlides - 1)) {
                settings.lastSlide.call(this);
            }

            // Stop
            if ((!vars || vars.stop) && !control) {
                return false;
            }

            // Trigger the beforeChange callback
            settings.beforeChange.call(this);

            // Set current background before change
            if (!control) {
                sliderImg.attr('src', vars.currentImage.attr('src'));
            } else {
                if (control === 'pre') {
                    sliderImg.attr('src', vars.currentImage.attr('src'));
                }
                if (control === 'next') {
                    sliderImg.attr('src', vars.currentImage.attr('src'));
                }
            }
            vars.currentSlide++;
            // Trigger the slideshowEnd callback
            if (vars.currentSlide === vars.totalSlides) {
                vars.currentSlide = 0;
                settings.slideshowEnd.call(this);
            }
            if (vars.currentSlide < 0) {
                vars.currentSlide = (vars.totalSlides - 1);
            }
            // Set vars.currentImage
            if ($(imgs[vars.currentSlide]).is('img')) {
                vars.currentImage = $(imgs[vars.currentSlide]);
            } else {
                vars.currentImage = $(imgs[vars.currentSlide]).find('img:first');
            }

            // Set active links
            if (settings.indicator) {
                $('a', vars.indicator).removeClass('active');
                $('a:eq(' + vars.currentSlide + ')', vars.indicator).addClass('active');
            }

            // Process caption
            processCaption(settings);

            // Remove any slices from last transition
            $('.sa-img-slice', slider).remove();

            // Remove any boxes from last transition
            $('.sa-img-box', slider).remove();

            var styles = [],
                currentEffect = vars.currentEffect.trim() || settings.effect;

            // Generate random effect
            switch (settings.effect) {
                case 'random':
                    {
                        styles = settings.styles.slice();
                        break;
                    }
                case 'randomLeft':
                    {
                        styles = settings.styles.slice().filter(function (style) {
                            return /.+Left$/.test(style);
                        });
                        break;
                    }
                case 'randomRight':
                    {
                        styles = settings.styles.slice().filter(function (style) {
                            return /.+Right$/.test(style);
                        });
                        break;
                    }
            }
            if (styles.length) {
                currentEffect = styles[Math.floor(Math.random() * styles.length)];
                if (currentEffect === undefined) {
                    currentEffect = 'fade';
                }
            }

            // Run random effect from specified set (eg: effect:['shutters','fade'])
            if (Object.prototype.toString.call(settings.effect).slice(8, -1) === 'Array') {
                styles = settings.effect;
                currentEffect = styles[Math.floor(Math.random() * styles.length)];
                if (currentEffect === undefined) {
                    currentEffect = 'fade';
                }
            }

            // Custom transition as defined by "data-transition" attribute
            if (vars.currentImage.attr('data-transition')) {
                currentEffect = vars.currentImage.attr('data-transition');
            }

            // Run effects
            vars.running = true;
            var timeBuff = 0,
                i = 0,
                slices = '',
                firstSlice = '',
                totalBoxes = '',
                boxes = '';
            if (settings.styles.slice(0, 3).indexOf(currentEffect) !== -1) {
                createSlices(slider, settings, vars);
                timeBuff = 0;
                i = 0;
                slices = $('.sa-img-slice', slider)._reverse();
                if (currentEffect === 'flickrSlicesRight') {
                    slices = $('.sa-img-slice', slider);
                }

                // rolling slices
                slices.each(function () {
                    var slice = $(this);
                    slice.css({
                        'top': '0px'
                    });
                    if (i === settings.slices - 1) {
                        setTimeout(function () {
                            slice.animate({
                                opacity: '1.0'
                            }, settings.speed, '', function () {
                                slider.trigger('sa:animFinished');
                            });
                        }, (100 + timeBuff) * 1.2);
                    } else {
                        setTimeout(function () {
                            slice.animate({
                                opacity: '1.0'
                            }, settings.speed);
                        }, (100 + timeBuff) * 1.2);
                    }
                    timeBuff += 50;
                    i++;
                });
            } else if (settings.styles.slice(3, 6).indexOf(currentEffect) !== -1) {
                createSlices(slider, settings, vars);
                if (currentEffect === 'shutters' || currentEffect === 'shuttersRight') {
                    timeBuff = 0;
                    i = 0;
                    $('.sa-img-slice', slider).each(function () {
                        var slice = $(this);
                        var origWidth = slice.width();
                        slice.css({
                            top: '0px',
                            width: '0px'
                        });
                        if (i === settings.slices - 1) {
                            setTimeout(function () {
                                slice.animate({
                                    width: origWidth,
                                    opacity: '1.0'
                                }, settings.speed * 1.1, '', function () {
                                    slider.trigger('sa:animFinished');
                                });
                            }, (100 + timeBuff));
                        } else {
                            setTimeout(function () {
                                slice.animate({
                                    width: origWidth,
                                    opacity: '1.0'
                                }, settings.speed * 1.1);
                            }, (100 + timeBuff));
                        }
                        timeBuff += 50;
                        i++;
                    });
                } else {
                    $('.sa-img-slice', slider).children('img').attr('src', $('img.sa-main-image').attr('src')).end().siblings('img.sa-main-image').attr('src', vars.currentImage.attr('src'));
                    i = settings.slices - 1;
                    timeBuff = 0;
                    for (var j = i; j >= 0; j--) {
                        var $slice = $('.sa-img-slice', slider).eq(j);
                        $slice.css({
                            opacity: '1',
                            top: '0px'
                        });
                        (function (slice) {
                            if (j === 0) {
                                setTimeout(function () {
                                    slice.animate({
                                        width: '0px',
                                        opacity: '0'
                                    }, settings.speed * 1.1, '', function () {
                                        slider.trigger('sa:animFinished');
                                    });
                                }, (100 + timeBuff));
                            } else {
                                setTimeout(function () {
                                    slice.animate({
                                        width: '0px',
                                        opacity: '0'
                                    }, settings.speed * 1.1);
                                }, (100 + timeBuff));
                            }
                        })($slice)
                        timeBuff += 50;
                    }
                }
            } else if (currentEffect === 'fade') {
                createSlices(slider, settings, vars);
                firstSlice = $('.sa-img-slice:first', slider);
                firstSlice.css({
                    'width': slider.width() + 'px'
                });
                firstSlice.animate({
                    opacity: '1.0'
                }, (settings.speed * 2), '', function () {
                    slider.trigger('sa:animFinished');
                });
            } else if (settings.styles.slice(7, 10).indexOf(currentEffect) !== -1) {
                createSlices(slider, settings, vars);
                var anim_css;
                firstSlice = $('.sa-img-slice:first', slider);
                if (currentEffect === 'scrollLeft') {
                    firstSlice.css({
                        'width': slider.width() + 'px',
                        'opacity': '1'
                    }).children('img:first').attr('src', $('img.sa-main-image', slider).attr('src')).siblings('.sa-img-slice').remove();
                    $('img.sa-main-image', slider).attr('src', vars.currentImage.attr('src'));
                    anim_css = {
                        width: '0px'
                    };
                } else {
                    firstSlice.css({
                        'width': '0px',
                        'opacity': '1'
                    }).siblings('.sa-img-slice').remove();
                    anim_css = {
                        width: slider.width() + 'px'
                    };
                }
                firstSlice.animate(anim_css, (settings.speed * 2.2), '', function () {
                    slider.trigger('sa:animFinished');
                });
            } else if (settings.styles.slice(10, 13).indexOf(currentEffect) !== -1) {
                createSlices(slider, settings, vars);
                firstSlice = $('.sa-img-slice:first', slider);
                var anim_css, fs_css;
                if (currentEffect === 'shuffleRight') {
                    firstSlice.css({
                        'width': slider.width() + 'px',
                        'opacity': '1',
                        'left': -slider.width() + 'px',
                        'right': ''
                    }).siblings('.sa-img-slice').remove();
                    anim_css = {
                        left: '0px'
                    };
                    fs_css = {
                        'left': '',
                        'right': '0px'
                    };
                } else {
                    firstSlice.css({
                        'width': '0px',
                        'opacity': '1',
                        'left': '',
                        'right': '0px'
                    }).siblings('.sa-img-slice').remove();
                    anim_css = {
                        width: slider.width() + 'px'
                    };
                    fs_css = {
                        'left': '0px',
                        'right': ''
                    };
                }
                firstSlice.animate(anim_css, (settings.speed * 1.8), 'linear', function () {
                    // Reset positioning
                    firstSlice.css(fs_css);
                    slider.trigger('sa:animFinished');
                });
            } else if (settings.styles.slice(13, 17).indexOf(currentEffect) !== -1) {
                var anim_css, fs_css;
                createSlices(slider, settings, vars);
                firstSlice = $('.sa-img-slice:first', slider);
                var anim_css = (currentEffect !== 'takeOutLeft') ? {
                    right: -slider.width()
                } : {
                    right: slider.width()
                };
                firstSlice.children('img').attr('src', $('img.sa-main-image', slider).attr('src')).end().css({
                    'width': slider.width(),
                    'opacity': '1',
                    'left': '',
                    'right': '0px'
                }).siblings('.sa-img-slice').remove().end().animate(anim_css, (settings.speed * 2), '', function () {
                    slider.trigger('sa:animFinished');
                });
                $('img.sa-main-image', slider).attr('src', vars.currentImage.attr('src'));
            } else if (currentEffect === 'randomGrids') {
                createBoxes(slider, settings, vars);
                totalBoxes = settings.boxCols * settings.boxRows;
                i = 0;
                timeBuff = 0;
                boxes = shuffle($('.sa-img-box', slider));
                boxes.each(function () {
                    var box = $(this);
                    if (i === totalBoxes - 1) {
                        setTimeout(function () {
                            box.animate({
                                opacity: '1'
                            }, settings.speed, '', function () {
                                slider.trigger('sa:animFinished');
                            });
                        }, (100 + timeBuff));
                    } else {
                        setTimeout(function () {
                            box.animate({
                                opacity: '1'
                            }, settings.speed);
                        }, (100 + timeBuff));
                    }
                    timeBuff += 20;
                    i++;
                });
            } else if (settings.styles.slice(-12).indexOf(currentEffect) !== -1) {
                createBoxes(slider, settings, vars);
                if (currentEffect === 'flickrWiderSlicesLeft') {
                    $('.sa-img-box', slider).children('img').attr('src', $('img.sa-main-image', slider).attr('src')).end().siblings('img.sa-main-image').attr('src', vars.currentImage.attr('src'));
                }
                totalBoxes = settings.boxCols * settings.boxRows;
                i = 0;
                timeBuff = 0;

                // Split boxes into 2D array
                var rowIndex = 0;
                var colIndex = 0;
                var box2Darr = [];
                box2Darr[rowIndex] = [];
                boxes = $('.sa-img-box', slider);
                if (currentEffect === 'flickrGridsUpLeft' || currentEffect === 'gridsShuffleUpLeft') {
                    boxes = $('.sa-img-box', slider)._reverse();
                }
                boxes.each(function () {
                    box2Darr[rowIndex][colIndex] = $(this);
                    colIndex++;
                    if (colIndex === settings.boxCols) {
                        rowIndex++;
                        colIndex = 0;
                        box2Darr[rowIndex] = [];
                    }
                });
                if (currentEffect === 'flickrGridsUp' || currentEffect === 'flickrGridsUpRight' || currentEffect === 'gridsShuffleUp' || currentEffect === 'gridsShuffleUpRight') {
                    for (var cols = 0; cols < (settings.boxCols * 2); cols++) {
                        var preCol = cols;
                        for (var rows = settings.boxRows - 1; rows >= 0; rows--) {
                            if (preCol >= 0 && preCol < settings.boxCols) {
                                (function (row, col, time, i, totalBoxes) {
                                    var box = $(box2Darr[row][col]);
                                    var w = box.width();
                                    var h = box.height();
                                    if (currentEffect === 'gridsShuffleUp' || currentEffect === 'gridsShuffleUpRight') {
                                        box.width(0).height(0);
                                    }
                                    if (i === totalBoxes - 1) {
                                        setTimeout(function () {
                                            box.animate({
                                                opacity: '1',
                                                width: w,
                                                height: h
                                            }, settings.speed, '', function () {
                                                slider.trigger('sa:animFinished');
                                            });
                                        }, (100 + time) * 1.2);
                                    } else {
                                        setTimeout(function () {
                                            box.animate({
                                                opacity: '1',
                                                width: w,
                                                height: h
                                            }, settings.speed);
                                        }, (100 + time) * 1.2);
                                    }
                                })(rows, preCol, timeBuff, i, totalBoxes);
                                i++;
                            }
                            preCol--;
                        }
                        timeBuff += 100;
                    }
                } else {
                    for (var cols = 0; cols < settings.boxCols * 2; cols++) {
                        var preCol = (currentEffect === 'boxesRainLeft' || currentEffect === 'flickrWiderSlicesLeft') ? (currentEffect === 'flickrWiderSlicesLeft' ? settings.boxCols - cols + 2 : settings.boxCols - cols - 1) : cols;
                        for (var rows = 0; rows < settings.boxRows; rows++) {
                            if (preCol >= 0 && preCol < settings.boxCols) {
                                (function (row, col, time, i, totalBoxes) {
                                    var box = $(box2Darr[row][col]);
                                    var w = box.width();
                                    var h = box.height();
                                    var box_css = {
                                        opacity: '1',
                                        width: w,
                                        height: h
                                    };
                                    if (currentEffect === 'boxesRain' || currentEffect === 'boxesRainLeft' || currentEffect === 'boxesRainRight' || currentEffect === 'gridsShuffleUpLeft') {
                                        box.width(0).height(0);
                                    } else if (currentEffect === 'flickrWiderSlicesLeft') {
                                        box.css('opacity', '1');
                                        box_css = {
                                            opacity: '0',
                                            width: 'auto',
                                            height: 'auto'
                                        };
                                    }
                                    if (i === totalBoxes - 1) {
                                        setTimeout(function () {
                                            box.animate(box_css, settings.speed * 1.2, '', function () {
                                                slider.trigger('sa:animFinished');
                                            })
                                        }, (100 + time));
                                    } else {
                                        setTimeout(function () {
                                            box.animate(box_css, settings.speed * 1.2);
                                        }, (100 + time));
                                    }
                                })(rows, preCol, timeBuff, i, totalBoxes);
                                i++;
                            }
                            currentEffect === 'boxesRainLeft' || currentEffect === 'boxesRainLeft' ? preCol++ : preCol--;
                        }
                        timeBuff += 100;
                    }
                }
            }
        };

        // Shuffle an array
        var shuffle = function (arr) {
            for (var j, x, i = arr.length; i; j = parseInt(Math.random() * i, 10), x = arr[--i], arr[i] = arr[j], arr[j] = x);
            return arr;
        };

        // Start / Stop
        this.stop = function () {
            if (!$(element).data('sa:vars').stop) {
                $(element).data('sa:vars').stop = true;
                trace('Stop Slider');
            }
        };

        this.start = function () {
            if ($(element).data('sa:vars').stop) {
                $(element).data('sa:vars').stop = false;
                trace('Start Slider');
            }
        };

        // Trigger the afterLoad callback
        settings.afterLoad.call(this);

        return this;
    };

    $.fn._reverse = [].reverse;

    $.fn.sliderAwesome = function (options) {
        return this.each(function (key, value) {
            var element = $(this);
            // Return early if this element already has a plugin instance
            if (element.data('sa-slider')) {
                return element.data('sa-slider');
            }
            // Pass options to plugin constructor
            var saSlider = new SliderAwesome(this, options);
            // Store plugin object in this element's data
            element.data('sa-slider', saSlider);
        });
    };

    //Default settings
    $.fn.sliderAwesome.defaults = {
        effect: 'default',
        slices: 15,
        boxCols: 8,
        boxRows: 4,
        speed: 500,
        delay: 5000,
        startSlide: 0,
        clickNav: true,
        keyboardNav: false,
        indicator: true,
        indicatorThumbs: false,
        pauseOnHover: true,
        manualAdvance: false,
        preText: 'Pre',
        nextText: 'Next',
        randomStart: false,
        styles: ["flickrSlices", "flickrSlicesLeft", "flickrSlicesRight", "shutters", "shuttersLeft", "shuttersRight", "fade", "scroll", "scrollLeft", "scrollRight", "shuffle", "shuffleLeft", "shuffleRight", "takeOut", "takeOutLeft", "takeOutRight", "shuffleAndTakeOut", "randomGrids", "flickrWiderSlices", "flickrWiderSlicesLeft", "flickrWiderSlicesRight", "boxesRain", "boxesRainLeft", "boxesRainRight", "flickrGridsUp", "flickrGridsUpLeft", "flickrGridsUpRight", "gridsShuffleUp", "gridsShuffleUpLeft", "gridsShuffleUpRight"],
        beforeChange: function () {},
        afterChange: function () {},
        slideshowEnd: function () {},
        lastSlide: function () {},
        afterLoad: function () {}
    };

})(jQuery);