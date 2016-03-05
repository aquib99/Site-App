var DB;
var sites;
var imgpath = "";
var audiopath = "";
var lat="";
var longt="";
var CreateSQL = 'CREATE TABLE IF NOT EXISTS SiteTable('+
				'id INTEGER PRIMARY KEY,'+
				'name TEXT NOT NULL,'+
				'notes TEXT NOT NULL,'+
				'lat TEXT NOT NULL,'+
				'longt TEXT NOT NULL,'+
				'img TEXT NOT NULL,'+
				'other TEXT NOT NULL)';
				
///////// Function will execute on document load
function LoadDB(){
	DB = prepareDB();
}

///////// Generic Error Message
function onError(error) {
    alert('code: '    + error.code    + '\n' +
          'message: ' + error.message + '\n');
}

/////////////////// Web SQL API //////////////////////////////////////////////			
function getOpenDB(){
	try{
		if (!! window.openDatabase) return window.openDatabase;
		else return undefined;
	}
	catch(e)
	{
		return undefined;
	}
}
	
function prepareDB(){
	var odb = getOpenDB();
	if (!odb)
	{
		alert('DB not Supported');
		return 
	}
	else
	{
		var db = odb('SiteDB','1.0','SiteAppDatabase',10*1024*1024);
		db.transaction(function(t){
			t.executeSql(CreateSQL,[],function(t,r){
				//alert ('Table Created and rows affected ' + r.rowsAffected);
			}, function (t,e){
				alert ('Ahh! DB Error ' + e.message);
			});
		},onError,function(){
			//alert("DbSuccessCB");
			getAllSites();
		});
		
		return db;
	}
}	

function getAllSites (){
	venues = [] ;
	if (DB)
	{
		DB.readTransaction(function(t){
			t.executeSql('SELECT * FROM SiteTable;',[],function(t,r){
				
				for (var i = 0; i <r.rows.length; i++ )
				{
					site = r.rows.item(i);
					venues.push(site);			
				}
				sites = venues;
			},function(t,e){
				alert ("Error occured while reading " + e.message);
			});	
			},onError,
			function(){
			//alert("ReadingSuccessCB");
			showSites();});
		sites = venues;
		return venues;
	}
	
}

function addNewSite(name,notes,lat,lng,img,other){
	if (DB)
	{
		DB.transaction(function(t){
			t.executeSql('INSERT INTO SiteTable(name,notes,lat,longt,img,other) VALUES(?,?,?,?,?,?)',
			[name,notes,lat,lng,img,other],
			function(t,r){
				alert('rows affected ' + r.rowsAffected)
				clearAddSitePage();
				
			},function(t,e){
				alert ('Insert onErrored  '+ e.message);
			});
			
		});
	}
		getAllSites();
}

function updateSite(id,name,notes,lat,longt,img,other){
	//alert(name+notes+lat+longt+img+other+id);
	if(DB)
	{
		DB.transaction(function(t){
		t.executeSql('UPDATE SiteTable SET name = ?,notes = ?,lat = ?,longt = ?,img = ?,other = ? WHERE id = ?',
		[name,notes,lat,longt,img,other,id],function(t,r){
			alert('Update Success!');
			$.mobile.changePage("#Home");
		},function(t,e){
			alert('Update onError '+ e.message );
		});	
		});
	}
		getAllSites();	
}

function deleteSite(id){
	var s = getSite(id);
	if (window.confirm("Are you sure?")) {   
		if(DB)
		{
			DB.transaction(function(t){
			t.executeSql('DELETE FROM SiteTable WHERE id = ?',
			[id],function(t,r){
				//alert('Deleted!'+ r.rowsAffected);
				DeleteFile(s.img);			
			},function(t,e){
				alert('Delete onError '+ e.message );
			});
				
			});
		}
			getAllSites();
	}
}

function getSite(id){
	var siteO;
	for (var i = 0;i<sites.length;i++)
	{
		if (sites[i].id == id) {
			siteO = sites[i];
		}
	}
	return siteO;
}
var s;
function showSite(id){
	s = getSite(id);
	if (s){	
		imgpath=s.img; //sets the current image to memory to recocnise any changes when updating
		lat=s.lat;
		longt=s.longt;
		$("#eImg").attr("src",s.img)
		$("#eName").val(s.name);
		$("#eNotes").val(s.notes);
		audiopath = s.other
		$("#emap").trigger("refresh");	
	}
	else{
		$.mobile.changePage( "#Home");
	}
	
}
$( document ).on( "pageshow", "#editSitePage", function( event ) {
			showMap("#emap",lat,longt);
});

function updateSiteValidate(id){
	sid = getSite(id);
	if(sid.img == imgpath)
	{
		if (sid.other == audiopath){
		updateSite(sid.id,$("#eName").val(),$("#eNotes").val(),lat,longt,imgpath,audiopath);
		}
		else{
			DeleteFile(sid.other);
			updateSite(sid.id,$("#eName").val(),$("#eNotes").val(),lat,longt,imgpath,audiopath);
		}
	}
	else
	{	
		if (sid.other == audiopath){
		copyImage(imgpath);
		updateSite(sid.id,$("#eName").val(),$("#eNotes").val(),lat,longt,imgpath,audiopath);
		DeleteFile(sid.img);
		}
		else{
			DeleteFile(sid.other);
			copyImage(imgpath);
			updateSite(sid.id,$("#eName").val(),$("#eNotes").val(),lat,longt,imgpath,audiopath);
			DeleteFile(sid.img);
		}
	}

	showSite(id);
}

function showSites(){
	if (sites.length!=0){
		$("#allSites").html('');
		for (var i = 0;i<sites.length;i++)
		{
			$("<li id ='"+sites[i].id+"'><a href='#editSitePage' data-transition='slide' onClick=showSite("+sites[i].id+")><img width=80 height=80  src='"+sites[i].img+"'/> <h2>"+sites[i].name+"</h2><p>"+sites[i].notes+"</p></a><a href='#' data-transition='pop' data-icon='delete'onClick=deleteSite("+sites[i].id+")></a></li>").appendTo("#allSites")
			console.log(sites[i].name);
			
		}
		$("#allSites").listview("refresh");
	}
	else{
		$("#allSites").html('<h2 align = "center" >No Sites Available<h2>');
	}
	
}

///////////////////////////////Camera Api///////////////////////////
function capturePhoto(elemntID) {
   navigator.camera.getPicture(function(picURI){
	   imgpath = picURI ;
	   $(elemntID).attr('src',imgpath);
	   },
	   function(e){
		   alert(error.message);
	   },{ quality: 50, destinationType: Camera.DestinationType.FILE_URI,correctOrientation: true});
}

//////////////////////// File API /////////////////////////////////////////////
function DeleteFile(path){
	window.resolveLocalFileSystemURL(path, 
	function(file){ //alert("File: " + file);
		file.remove(function(){
			//alert("Photo Removed")
		},function(e){
			alert("File Remove Error :"+ e.code);})
	}, function(e){
		//alert("File path resolve onError: "+ e.code);
	});
} 

function copyImage(timgp){
	window.resolveLocalFileSystemURL(timgp, function(fileEntry){var date = new Date();
    var TStamp = date.getTime();
    ImageName = TStamp + '.jpg';
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSys) { 
        fileSys.root.getDirectory('SitePhotos', {create: true, exclusive: false}, 
		function(dir) 
		   { 
			imgpath=fileSys.root.nativeURL+"/SitePhotos/"+ImageName;
			   fileEntry.copyTo(dir, ImageName,function (entry){
				   //alert("Photo Copied");
				   },onError);			   
           }, onError); 
   }, onError); 
  }, onError);	
}

///////////////////////////// UI Javascript /////////////////////////////////////////
$('#addSite').click(function(){
	if ($("#sName").val()!= ''){
		validateAdd();
	}
	else{
		alert("Enter a name")
	}
	
});

function validateAdd(){
	if (imgpath!=""){
		if (lat!=""){
			copyImage(imgpath);
			addNewSite($("#sName").val(),$("#sNotes").val(),lat,longt,imgpath,audiopath);
		}
		else
		{
			alert("Location Not Available");
		}
	}
	else{alert("Image Not Avialable");}
}

$('#updateSite').click(function(){
	if ($("#eName").val()!= ''){
		updateSiteValidate(s.id);
	}
	else{
		alert("Enter a name")
	}
	
});

$("a[href='#addVenue']").click(function(){
	getLocation('#map');
})

$("a[href='#Home']").click(function(){
			//showSites();
			clearAddSitePage();
			clearEditSitePage();
			lat="";
			longt="";
			imgpath="";
			
})
			
function clearAddSitePage(){
	$("#sLoc").html("");
	$("#sName").val("");
	$("#sNotes").val("");
	$("#sLat").val("");
	$("#sLongt").val("");
	$("#sOther").val("");
	$("#siteImg").attr('src','img/pna.jpg');
	audiopath="";
	imgpath="";
	lat="";
	longt="";
	$('#map').html('');
}

function clearEditSitePage(){
	
	$("#eName").val("");
	$("#eNotes").val("");
	$("#eLat").val("");
	$("#eLongt").val("");
	$("#eImage").val("");
	$("#eOther").val("");
	$("#eImg").attr('src','img/pna.jpg');
	$("#eLoc").html("");
	audiopath="";
	imgpath="";
	lat="";
	longt="";
	$('#emap').html('');
}

/////////////////////////// Geo Location API /////////////////////////////////////////
var map = "";
function getLocation(m){
	map = m;
	$(map).html('');
	$(map).append($('<div align="center">loading location... <img src="img/spinner-small.gif"/><div>'))
	navigator.geolocation.getCurrentPosition(onlocSuccess, function(e){alert("Location error: " + e.message ); $(map).html('');});
}

function onlocSuccess(position) {
	//alert("La: "+ position.coords.latitude+" Lo: "+position.coords.longitude);
	lat = position.coords.latitude;
	longt = position.coords.longitude;
	//loc = "Latitude:"+ position.coords.latitude +" Longitude:" +position.coords.longitude;
	//("#sLoc").val(loc);
	showMap(map,lat,longt);
   					  
}

function showMap(divName,lat,longt){
	//alert("....: "+lat+longt+divName);
	map=divName
	nmap = divName.replace(/^#/, "");
	$(map).html('');
	var mapProp = {
		center:new google.maps.LatLng(lat,longt),
		zoom:15,
		mapTypeId:google.maps.MapTypeId.ROADMAP
	};
	var map=new google.maps.Map(document.getElementById(nmap), mapProp);
	var marker=new google.maps.Marker({
	position:new google.maps.LatLng(lat,longt),
	animation:google.maps.Animation.BOUNCE
	});
	marker.setMap(map);
}

function captureAudio() 
{
    navigator.device.capture.captureAudio(function(mediaFiles){
		for (var i = 0; i < mediaFiles.length; i += 1) 
		{
			audiopath = mediaFiles[i].fullPath;
			//alert(audiopath);
			copyAudioFileEntry(audiopath);
		}	
	}, function(e){
		alert('Error occurred during audio record: ' + e.message);
	},{limit:1});
}

function copyAudioFileEntry(AudioURI)
{
  window.resolveLocalFileSystemURL(AudioURI,function(AudioEntry){
	var date = new Date();
    var TStamp = date.getTime();
    var AudioName = TStamp + '.mp3';
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSys) { 
        fileSys.root.getDirectory('SiteAudio', {create: true, exclusive: false}, 
		function(dir) 
		   { 
			   AudioEntry.copyTo(dir, AudioName,function(){
				   //alert("Audio copy suucess");
				   },onError);
			   audiopath=fileSys.root.nativeURL+"/SiteAudio/"+AudioName;//copying and storing the audio path
           }, onError); 
   }, onError); 
  },onError);  
}

function playAudio(datapath) 
{    //alert("Play Audio: " + datapath);
    var vomedia = new Media(datapath,
        function(){},function (err) {
            //alert("Audio Not Found! Error:" + err.message);
			if (window.confirm("Audio Not Found! Would you like to record now?")){
				captureAudio();
			}
    });
    vomedia.play();
}










