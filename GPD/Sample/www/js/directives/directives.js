angular.module('go-plan-do.directives', [])
.directive('sortable', ['$ionicGesture', '$ionicScrollDelegate', function ($ionicGesture, $ionicScrollDelegate) {
    
    return {
        restrict: 'A',
        scope: {
            draggable: '@',
            sorted: '&',
            collapsedBuckets:'=',
        },
        link: function (scope, element, attrs) {
            var settings = {
                draggable: scope.draggable ? scope.draggable : '.item',
                duration: 200
            };
            var dragging = null, placeholder = null, offsetY = 0, marginTop = 0;
            var itemSet,initialIndex,newIndex,currentIndex, animating = false,insertedBefore,insertedAfter;
            var fromBucket, toBucket, itemID, triageBucketIDIndex = 0;
            var placeholderHeight;
            var scrollInterval;

            var createPlaceholder = function createPlaceholder(height) {                  
                // Use marginTop to compensate for extra margin when animating the placeholder
                return $('<div></div>')
                        .css({
                            height: height + 'px',
                            marginTop: (currentIndex > 0 ? -marginTop : -1) + 'px'
                        })
                        .addClass('placeholder');
            };

            var touchHold = function touchHold(e) {
                // Get the element we're about to start dragging
                dragging = angular.element(e.target).closest(settings.draggable);
                insertedBefore = false;
                insertedAfter = false;

                if (!dragging.length) dragging = null;

                if (dragging) {
                    //hide the badge if we are about to start dragging
                    $('.badge.homepage').css({display:'none'});
                    $('.item-divider.homepage').css({'margin-top':'0px'});
                    // Get the initial index
                    initialIndex  = dragging.index(settings.draggable);
                    //reduce the intial index by 1 so as to cater for the item input header
                    initialIndex = initialIndex -1;
                    currentIndex = initialIndex;

                    var position = dragging.position();

                    // Get relative position of touch
                    var clientY = e.gesture.touches[0].clientY;
                    offsetY = clientY - position.top - element.offset().top;

                    // Switch to Absolute position at same location
                    dragging.css({
                        position: 'absolute',
                        zIndex: 10000,
                        left: position.left + 'px',
                        top: position.top + 'px',
                        width: dragging.outerWidth() + 'px'
                    })
                    .addClass('dragging');

                    // Get the set of items that were re-ordering with excluding the work item currently being d &d
                    itemSet = element.find(settings.draggable + ':not(.dragging)'); 
                    itemSet.filter(function(index,el){
                        if(el!==undefined){
                            if(el.className==="item-divider homepage item ng-hide"){
                               itemSet.splice(index,1);//remove the hidden triage bucket
                            }

                        }
                    });

                   //get triage bucket index if bucket is shown
                    itemSet.filter(function(index,el){
                        if(el!==undefined){
                            if(parseInt(el.attributes.bucketid.value)===5 
                                && el.className==="item-divider homepage item"){
                               triageBucketIDIndex = index;
                            }

                        }
                    }); 

                    //remove collapsed work items to make the filtering even
                    if(scope.collapsedBuckets.length>0){
                        for(var w=0; w < scope.collapsedBuckets.length; w++){
                            var collapsedBucket =  scope.collapsedBuckets[w];  
                            var k = itemSet.length;          
                            while(k--){
                                var el = itemSet[k];                      
                                if(el!==undefined){
                                    if(el.className!=="item-divider homepage item"){
                                        if(parseInt(collapsedBucket.bucketID)===parseInt(el.attributes.bucketid.value))
                                        {
                                             itemSet.splice(k,1);
                                        }
                                      
                                    }
                                }

                            }

                        }
                    }                  
                    // We need to know the margin size so we can compensate for having two
                    // margins where we previously had one (due to the placeholder being there)
                    marginTop = parseInt(dragging.css('marginTop')) + 2;

                    // Replace with placeholder (add the margin for when placeholder is full size)
                    placeholderHeight = dragging.outerHeight() + marginTop + 5;
                    placeholder = createPlaceholder(placeholderHeight);
                    placeholder.insertAfter(dragging); 

                    // Interval to handle auto-scrolling window when at top or bottom
                    initAutoScroll();
                    scrollInterval = setInterval(autoScroll, 20);
                }
            };
            var holdGesture = $ionicGesture.on('hold', touchHold, element);

            var touchMove = function touchMove(e) {
                if (dragging) {
                    e.stopPropagation();
                    touchY = e.touches ? e.touches[0].clientY : e.clientY;
                    var newTop = touchY - offsetY - element.offset().top;
                     //  console.log(newTop);
                    // Reposition the dragged element
                    dragging.css('top', newTop + 'px');
                    // Check for position in the list
                    newIndex = 0;                    
                    itemSet.each(function (i) {                      
                        if (newTop > $(this).position().top) {
                            newIndex = i + 1;                          
                        }                                          
                    });                
            
                    if (!animating && newIndex !== currentIndex && newIndex > 0) {
                        currentIndex =  newIndex; 
                        var currentBucket = $(itemSet[currentIndex -1]).attr("bucketID");
                        if(parseInt(currentBucket)!==5
                            || (parseInt(currentBucket)===5 && initialIndex > triageBucketIDIndex)){
                             
                            var oldPlaceholder = placeholder;
                            // Animate in a new placeholder
                            placeholder = createPlaceholder(1);
                            // Put it in the right place
                            if (newIndex < itemSet.length) {
                                placeholder.insertBefore(itemSet.eq(newIndex));
                                insertedBefore = true;
                            } else {
                                placeholder.insertAfter(itemSet.eq(itemSet.length - 1));
                                insertedAfter = true;
                            }    
                        }
                        else{
                            currentIndex = initialIndex;

                        }                        
                       
                        if(placeholder!=null){                      
                             // Animate the new placeholder to full height
                            animating = true;
                            if(oldPlaceholder!==undefined){
                                 setTimeout(function () {
                                    placeholder.css('height', placeholderHeight + 'px');
                                    // Animate out the old placeholder
                                    oldPlaceholder.css('height', 1);

                                    setTimeout(function () {
                                        oldPlaceholder.remove();
                                        animating = false;
                                    }, settings.duration);
                                }, 50);
                            }

                           
                        }
                    }
                }
            };

            var touchMoveGesture = $ionicGesture.on('touchmove', touchMove, element);
            var mouseMoveGesture = $ionicGesture.on('mousemove', touchMove, element);

            var touchRelease = function touchRelease(e) {
                if (dragging) {
                    // Set element back to normal
                    dragging.css({
                        position: '',
                        zIndex: '',
                        left: '',
                        top: '',
                        width: ''
                    }).removeClass('dragging');
                    // Remove placeholder after 100 milliseconds so as to make sure it has been animated out before nullfying it
                     setTimeout(function () {
                          placeholder.remove();
                          placeholder = null;
                          $('.badge.homepage').css({display:'inline'});
                          $('.item-divider.homepage').css({'margin-top':'-25px'});
                      }, 100);
                    triageBucketIDIndex = 0;
                    animating = false;
                                 
                    if (initialIndex!==currentIndex&&scope.sorted) {   
                       
                         // Call the callback with the instruction to re-order
                        scope.$fromIndex = initialIndex;
                        scope.$toIndex = currentIndex;
                        scope.$apply(scope.sorted);  
                
                    }                
                    dragging = null;                
                    clearInterval(scrollInterval);
                }
            };
            var releaseGesture = $ionicGesture.on('release', touchRelease, element);
            scope.$on('$destroy', function () {
                $ionicGesture.off(holdGesture, 'hold', touchHold);
                $ionicGesture.off(touchMoveGesture, 'touchmove', touchMove);
                $ionicGesture.off(mouseMoveGesture, 'mousemove', touchMove);
                $ionicGesture.off(releaseGesture, 'release', touchRelease);
            });

            var touchY, scrollHeight, containerTop, maxScroll;
            var scrollBorder = 80, scrollSpeed = 0.2;
            // Setup the autoscroll based on the current scroll window size
            var initAutoScroll = function initAutoScroll() {
                touchY = -1;
                var scrollArea = element.closest('.scroll');
                var container = scrollArea.parent();
                scrollHeight = container.height();
                containerTop = container.position().top;
                maxScroll = scrollArea.height() - scrollHeight;
            };        
            // Autoscroll function to scroll window up and down when
            // the touch point is close to the top or bottom
            var autoScroll = function autoScroll() {
                var scrollChange = 0;
                if (touchY >= 0 && touchY < containerTop + scrollBorder) {                
                    // Should scroll up
                    scrollChange = touchY - (containerTop + scrollBorder);
                } else if (touchY >= 0 && touchY > scrollHeight - scrollBorder) {                   
                    // Should scroll down
                    scrollChange = touchY - (scrollHeight - scrollBorder);
                }

                if (scrollChange !== 0) {
                    // get the updated scroll position
                    var newScroll = $ionicScrollDelegate.getScrollPosition().top + scrollSpeed * scrollChange;
                    // Apply scroll limits
                    if (newScroll < 0)
                        newScroll = 0;
                    else if (newScroll > maxScroll)
                        newScroll = maxScroll;
                    // Set the scroll position
                    $ionicScrollDelegate.scrollTo(0, newScroll, false);
                }
            };

        }
    };
}])
.directive('getPercentage', [function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var p = (attrs.getPercentage/scope.totalCount) * 100;
            if (!scope.$$phase){
             scope.$apply(function () {             
                element.css('background','-webkit-linear-gradient(left, #74c0d6 '+p+'% ,#ffffff '+p+'%)');
                element.css('background', '-moz-linear-gradient(left, #74c0d6 '+p+'% ,#ffffff '+p+'%)');
                element.css('background', '-ms-linear-gradient(left, #74c0d6 '+p+'% ,#ffffff '+p+'%)');
                element.css('background','-o-linear-gradient(left, #74c0d6 '+p+'% ,#ffffff '+p+'%)');
                element.css('background', 'linear-gradient(to right, #74c0d6 '+p+'% ,#ffffff '+p+'%)');
                });
            }else{
                element.css('background','-webkit-linear-gradient(left, #74c0d6 '+p+'% ,#ffffff '+p+'%)');
                element.css('background', '-moz-linear-gradient(left, #74c0d6 '+p+'% ,#ffffff '+p+'%)');
                element.css('background', '-ms-linear-gradient(left, #74c0d6 '+p+'% ,#ffffff '+p+'%)');
                element.css('background','-o-linear-gradient(left, #74c0d6 '+p+'% ,#ffffff '+p+'%)');
                element.css('background', 'linear-gradient(to right, #74c0d6 '+p+'% ,#ffffff '+p+'%)');
            } 
           
           /* element.css('background':'blue');*/
        }
    }

}])
.directive('angularMarquee', ['$timeout',function($timeout) {
       return {
            restrict: 'A',
            scope: {
                scroll:'@',
                duration:'@',
                workItemId:'@',
            },
            compile: function(tElement, tAttrs) {
                if (tElement.children().length === 0) {
                    tElement.append('<div>' + tElement.text() + '</div>');
                }
                var content = tElement.children();
                var $element = $(tElement);
                $(tElement).empty();
                tElement.append('<div class="angular-marquee" style="float:left;">' + content.clone()[0].outerHTML + '</div>');
                var $item = $element.find('.angular-marquee');
                $item.clone().css('display','none').appendTo($element);                
                $element.wrapInner('<div style="width:100000px" class="angular-marquee-wrapper"></div>');              
                    return {
                        post: function(scope, element, attrs) {           
                                

                            //direction, duration,
                            var $element = $(element);
                            var $item = $element.find('.angular-marquee:first'); 
                            var $marquee = $element.find('.angular-marquee-wrapper');
                            var $cloneItem = $element.find('.angular-marquee:last');
                            var duplicated = false;
                            var containerWidth = parseInt($element.width());
                            var itemWidth = parseInt($item.width());
                            var defaultOffset = 20;
                            var duration = 3000;
                            var scroll = false;
                            var animationCssName = '';
                            var workItemID = null;
                        

                            function calculateWidthAndHeight() {
                                containerWidth = parseInt($element.width());
                                itemWidth = parseInt($item.width());
                                if (itemWidth > containerWidth) {
                                    duplicated = true;
                                } else {
                                    duplicated = false;
                                }

                                if (duplicated) {
                                $cloneItem.show();
                                } else {
                                    $cloneItem.hide();
                                }

                                $element.height($item.height() - 15);
                            }

                            function _objToString(obj) {
                                var tabjson = [];
                                for (var p in obj) {
                                        if (obj.hasOwnProperty(p)) {
                                                tabjson.push(p + ':' + obj[p]);
                                        }
                                }
                                tabjson.push();
                                return '{' + tabjson.join(',') + '}';
                            };

                            function calculateAnimationDuration(newDuration) {
                                var result = (itemWidth + containerWidth) / containerWidth * newDuration / 1000;
                                if (duplicated) {
                                    result = result / 2;
                                }
                                return result;
                            }

                            function getAnimationPrefix() {
                                var elm = document.body || document.createElement('div');
                                var domPrefixes = ['webkit', 'moz','O','ms','Khtml'];

                                for (var i = 0; i < domPrefixes.length; i++) {
                                    if (elm.style[domPrefixes[i] + 'AnimationName'] !== undefined) {
                                        var prefix = domPrefixes[i].toLowerCase();
                                        return prefix;
                                    }
                                }
                            }

                            function createKeyframe(number) {
                                var prefix = getAnimationPrefix();

                                var margin = itemWidth;
                                // if (duplicated) {
                                //  margin = itemWidth
                                // } else {
                                //  margin = itemWidth + containerWidth;
                                // }
                                var keyframeString = '@-' + prefix + '-keyframes ' + 'simpleMarquee' + number;
                                var css = {
                                    'margin-left': - (margin) +'px'
                                }
                                var keyframeCss = keyframeString + '{ 100%' + _objToString(css) + '}';
                                var $styles = $('style');

                                //Now add the keyframe animation to the head
                                if ($styles.length !== 0) {
                                        //Bug fixed for jQuery 1.3.x - Instead of using .last(), use following
                                        $styles.filter(":last").append(keyframeCss);
                                } else {
                                        $('head').append('<style>' + keyframeCss + '</style>');
                                }
                            }

                            function stopAnimation() {
                                $marquee.css('margin-left',0);
                                if (animationCssName != '') {
                                    $marquee.css(animationCssName, '');
                                }

                            }


                            function createAnimationCss(number) {
                                var time = calculateAnimationDuration(duration);
                                var prefix = getAnimationPrefix();
                                animationCssName = '-' + prefix +'-animation';
                                var cssValue = 'simpleMarquee' + number + ' ' + time + 's 0s linear infinite';
                                $marquee.css(animationCssName, cssValue);
                                $marquee.css('margin-right',20);
                                if (duplicated) {
                                    $marquee.css('margin-left', 0);
                                } else {
                                    var margin = containerWidth + defaultOffset;
                                    $marquee.css('margin-left', margin);
                                }
                            }

                            function animate() {
                                //create css style
                                //create keyframe
                                calculateWidthAndHeight();
                                var number = Math.floor(Math.random() * 1000000);
                                createKeyframe(number);
                                createAnimationCss(number);
                            }

                            attrs.$observe('scroll', function(scrollAttrValue) {
                                scroll = (scrollAttrValue === 'true');
                                recalculateMarquee();
                            });

                            function recalculateMarquee() {
                                if (scroll) {
                                    animate();
                                } else {
                                    stopAnimation();
                                }
                            }                           

                            attrs.$observe('duration', function(durationText) {
                                duration = parseInt(durationText);
                                if (scroll) {
                                    animate();
                                }
                            });
                        }
                    }
                }
            };
}])
.directive('editWorkItemTitleMarquee',[function(){
    return {
        restrict: 'A',
        scope :{
             scroll:'@',
        },
        link: function (scope, element, attrs) {
            console.log(scope.scroll);
            //  console.log(element);
             var $element = $(element);
            var marquee = $element.find('.edit-workitem-marquee');
           // console.log(marquee);
            marquee.css({"overflow": "hidden", "width": "100%", "white-space": "nowrap"});

            // wrap "My Text" with a span (IE doesn't like divs inline-block)
            marquee.wrapInner("<span>");
            marquee.find("span").css({ "width": "auto", "white-space": "nowrap", "display": "inline-block", "text-align":"center", "padding-right": "10px" }); 
            var w = marquee.find("span").width();
            marquee.append(marquee.find("span").clone()); // now there are two spans with "My Text"

            marquee.wrapInner("<div>");
            marquee.find("div").css("width", (w*2)+'px');

            var reset = function() {
                $(this).css("margin-left", "0");
                $(this).animate({ "margin-left": "-"+w+"px" }, 40000, 'linear', reset);
            };

            reset.call(marquee.find("div"));
        }
    };

}]);


