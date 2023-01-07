$(document).ready(function(){
    var domHeight= document.body.scrollHeight
    var hasMsg= false

    var flag= true

    $userRegistration= $('#userRegistration')
    $registeredUser = $('#registeredUser')
    $users= $('#users')
    $chats= $('#chats')
    $socketLive= $('#socketLive')
    $sentMessage= $('#sentMessage')
    $hitSend= $('#hitSend')
    $clearChat= $('#clearChat')
    $clearUsers= $('#clearUsers')
    $regUserSubmitBtn= $('#regUserSubmitBtn')
    $typeMsgSection= $('#typeMsgSection')
    $registeredUser.focus()

    WebSocket.prototype.emit= function(event, data){
        this.send(JSON.stringify({event, data}))
        $socketLive.text("WebSocket is Not Live! Refresh the page!")
    }


    WebSocket.prototype.listen= function(eventName, callback){
        this._socketListeners = this._socketListeners || {}
        this._socketListeners[eventName] = callback
    }

    const socketClient = new WebSocket('ws://localhost:5040/server')

    socketClient.onopen= function(){
        console.log('WebSocket is Live! Enter your name!')
        $socketLive.text("WebSocket is Live! Enter your name!")
        if($chats.html() == 0){
            $clearChat.attr('disabled', true)
        }
        $hitSend.attr('disabled', true)
    }

    socketClient.onmessage= function(e){
        try{
            const{ event, data} = JSON.parse(e.data)
            socketClient._socketListeners[event](data)
        }catch(error){

        }
    }

    $sentMessage.on('keyup', function(){
        if($(this).val()) {
            $hitSend.attr('disabled', false)

            if(!hasMsg){
                hasMsg= true
                socketClient.emit('addTypingUsers')
            }
        } else{
            $hitSend.attr('disabled', true)
            hasMsg= false
            
            socketClient.emit('removeTypingUsers')

        }
    })
    $hitSend.on('click', function(event){
        event.preventDefault()
        let msg= $sentMessage.val()
        if(msg == ''){
            return
        }
        $sentMessage.val('')
        socketClient.emit('oldMessage', {msg})
        hasMsg= false
        socketClient.emit('removeTypingUsers')
        $('.peopleTyping').text('Type Message: ')
    })

    $clearUsers.on('click', function(){
        $users.empty()
        socketClient.emit('removeAllUsers')
    })

    $clearChat.on('click', function(){
        $clearChat.attr('disabled', true)
        $sentMessage.focus()
        flag= true
        domHeight= document.body.scrollHeight

        $chats.animate({
            'height': '0px',
            'overflow-y': 'hidden',
            'padding-right': '0px'
        }, 'slow', function(){
            $chats.removeAttr('style')
            $chats.empty()
        })
        $typeMsgSection.css({
            'margin-top': '0px'
        })
        $('.peopleTyping').text('Type Message: ')
    })
    $regUserSubmitBtn.on('click', function(){
         window.currentUser = $registeredUser.val()
        if(currentUser == ''){
            alert('please enter a name')
            return
        }
        socketClient.emit('thisUser', {user: currentUser, onlineStatus: 'green'})
        $registeredUser.val('')
        $userRegistration.fadeOut('slow', function(){
            $('.chat-section').fadeIn('slow')


            $sentMessage[0].style.width= '100%'
            $sentMessage[0].style.display= 'flex'
            $sentMessage.focus() 
        })
    })

    socketClient.listen('newMessage', function(data){
        let prevOffsetTop= 0, currOffsetTop=0
        if($chats.html() == ''){
            prevOffsetTop= $typeMsgSection.offset.top
        }
        $chats.append('<div class="well well-sm" style="font-size: 18px">'+ '<strong>'+ data.user+ ': </strong>'+
        data.msg + '</div>').fadeIn('slow')

        $chats.scrollTop($chats[0].scrollHeight)
        if($chats.contents().length == 1){
            currOffsetTop= $typeMsgSection.offset.top
        }
        $typeMsgSection.css({
            'margin-top': '15px'
        })

        if(
            flag && 
            $typeMsgSection.offset().top + 
            $typeMsgSection.height() + 
            parseInt($typeMsgSection.css('margin-top')) +
            parseInt($('body').css('margin-top')) + 
            currOffsetTop -
            prevOffsetTop >= 
            domHeight
        ) {
            $chats.css({
                'overflow-y': 'scroll',
                'padding-right': '10px',
                height: 
                    $typeMsgSection.position().top-
                    parseInt($('body').css('margin-top')) -
                    parseInt($typeMsgSection.css('margin-top'))
            })
            $chats.scrollTop($chats[0].scrollHeight)
            flag= false
        }
        $clearChat.attr('disabled', false)
    })

    $(window).blur(function(){
        socketClient.emit('updateUserStatus', 'yellow')
        return
    })
    $(window).focus(function(){
        socketClient.emit('updateUserStatus', 'green')
        return
    }) 
    socketClient.listen('all-Users', function(obj){
        let html= ''
        let imgSrc= ''
     
        for(let i=0; i<obj.length; i++){
            if(obj[i].status == 'green'){
                imgSrc= ' <img src="https://upload.wikimedia.org/wikipedia/commons/1/1d/Online_dot.png"  alt="online-green-dot" height= "8px" width="8px"/>'
            } else{
                imgSrc= '<img src= "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Yellow_Dot_by_DraGoth.png/600px-Yellow_Dot_by_DraGoth.png" alt="online-green-dot" height="8px" width="8px"/>'
            }
            html += '<li class="list-group-item"> '+ imgSrc + obj[i].user + '</li>'
        }
        $users.append(html)
    })
    socketClient.listen('showTypingUsers', function(data) {
        let str= ''
        var cnt=0 
        data.forEach(function(obj){
            if(obj.user != currentUser){
                str += obj.user + ', '
                cnt++
            }
        })
        str= str.substring(0, str.length -2)
        if(cnt ==0){
            $('.peopleTyping').text('Type Message: ')
        } else if(cnt==1){
            $('.peopleTyping').text('Type Message: ' +str+ ' is typing...')
        } else if(cnt==2){
            $('.peopleTyping').text('Type Message: ' +str+ ' are typing...')
        } else{
            $('.peopleTyping').text('Type Message: ' +cnt+ ' people are typing...')
        }
    })
}) 