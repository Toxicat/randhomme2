module.exports = function (self) {
	self.routes = { };
	self.post = { };
		
	self.routes['/'] = function (req, res) {
		res.setHeader('Content-Type', 'text/html');
		self.rCache();
		res.send(self.cache_get('index.html') );
	};

	// Handle status checks on chunks through Flow.js
	self.app.get('/upload', function (req, res){
		return self.uploader
			.chunkExists(req)
			.then(
				() => res.status(200).send(),
				() => res.status(204).send()
		);
	});

	self.app.get('/melt', function (req, res) {
		var query = self.hommeModel.find(null);

		query.exec(function (err, docs) {
			if (err) throw err;

			var src =	[self.uploadPath+"/"+docs[0].code+".jpg",
						self.uploadPath+"/"+docs[1].code+".jpg",
						self.uploadPath+"/"+docs[2].code+".jpg",
						self.uploadPath+"/"+docs[3].code+".jpg"];
			var meltPath = self.tempPath+"/"+docs[0].code+docs[1].code+docs[2].code+docs[3].code+".jpg";
			var tempIndex = self.tempPath+"/"+"tempIndex.jpg";

			var size = 10;

			var meltFct = function (self, src, meltPath, tempIndex, index, counter, req, res) {
				console.log("index: "+index+" // counter: "+counter);
				if (counter < 680)
				{
					if (index == 4)
						index = 0;
					self.gm(src[index]).chop(counter, 0, 0).write(tempIndex, function (err) {
						if (err) throw err;
						self.gm(meltPath).append(tempIndex, true).chop(679, 0, counter).write(meltPath, function (err) {
							if (err) throw err;
							console.log("I go deeper !");
							meltFct(self, src, meltPath, tempIndex, index+1, counter+size, req, res);
						});
					});
				}
				else
				{
					console.log("Return result");
					var img = self.fs.readFileSync(meltPath);
					res.set('Access-Control-Allow-Origin', '*');
					res.writeHead(200, { 'Content-Type':'image/jpg' });
					res.end(img, 'binary');
				}
				console.log("To the surface !");
			}
			var melt = self.gm(src[0]).chop(680-size, 916, 1, 0).write(meltPath, function (err) {
				if (err) throw err;
				meltFct(self, src, meltPath, tempIndex, 1, size+1, req, res);
			});
		});
	});

	// Handle uploads through Flow.js
	self.app.post('/upload', self.multipartMiddleware, function(req, res) {
		return self.newHomme(req, res);
		/*return self.uploader
			.saveChunk(req)
			.then(
				status => res.status(200).send(status), //console.log(status), 
				err => res.status(400).send(err) //console.log(err)
			);*/
	});
}