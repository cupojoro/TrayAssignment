/**
 * Helper class for create points in 2d space.
 */
class point
{
	constructor(inString)
	{
		let couple = inString.split(" ");
		if (couple.length != 2)
		{
			throw("Input Point is not formatted properly");
		}
		try
		{
			if(couple[0].length == 0 || couple[1].length == 0)
			{
				throw("Value being parsed for point is empty.");
			}
			this.x = parseInt(couple[0], 10);
			this.y = parseInt(couple[1], 10);
			
			//Included this since the catch doesn't seem to work.
			if (isNaN(this.x) || isNaN(this.y))
			{
				throw("Value being parsed for point is not a number.");
			}
		}catch(e)
		{
			throw("Value being parsed for point is not a number.");
		}
	}
	
	//I don't not believe ovverrides work by default.
	toString()
	{
		return "(" + this.x + "," + this.y + ")";
	}
}

/**
 * The Roomba class processes a file containing location data and
 * movement instructions. The Roomba class will then log the amount
 * of spots cleaned and its final position.
 */
class Roomba
{
	
	constructor()
	{
		this.fileContents = null;
		this.dimensions = null;
		this.startLoc = null;
		this.currentLoc = null;
		this.navString = null;
		this.dirtLocations = null;
		this.lookUpArray = null;
		this.totalCleaned = 0;
	}
	
	/**
	 * Activate Roomba to process file and log total cleaned spots and final position.
	 *
	 * Parameters:
	 * 	file: Blob
	 * 		-Schema
	 * 			row0: Dimensions
	 * 			row1: Roomba start location
	 * 			row[2-> (n-1)]: Dirt Locations
	 * 			row[-1]: Movement instructions.
	 */			
	activate(file)
	{
		this.readFile(file).then(value => {
			console.log("File Read Successfully.");
			this.fileContents = value;
			
			this.parseInputText();
			console.log("File Parsed Successfully. Running Roomba.");
			
			this.run();
		}, reason => {
			console.error(reason);
		});
	}
	
	/*
	 * Itterate though the movement instructions, checking for dirt patches,
	 * at completion log total cleaned and end spot.
	 * Since the dirt patches are effectively hashed, the runtime for this should be
	 * the fastest.
	 */
	run()
	{
		if (this.checkCurrentLocationForDirt())
		{
			this.totalCleaned += 1;
		}
		
		[...this.navString].forEach((direction) => {
			if (direction == "N" )
			{
				//Bounds Check
				if(this.currentLoc.y < (this.dimensions.y - 1)) this.currentLoc.y += 1;
			}else if (direction == "S")
			{
				//Bounds Check
				if(this.currentLoc.y > 0) this.currentLoc.y -= 1;
			}else if( direction == "W")
			{
				//Bounds Check
				if(this.currentLoc.x > 0) this.currentLoc.x -=1;
			}else if(direction == "E")
			{
				//Bounds Check
				if(this.currentLoc.x < (this.dimensions.x- 1)) this.currentLoc.x += 1;
			}else
			{
				throw("Unknown Navigation: " + direction);
			}
			if (this.checkCurrentLocationForDirt())
			{
				this.totalCleaned += 1;
			}
		});
		
		console.log("End Location : (" + this.currentLoc.x + "," + this.currentLoc.y + ")");
		console.log("Total Cleaned : " + this.totalCleaned);
		
	}
	
	/*
	 *Helper function for mantaining the 'hashed' dirt locations.
	 *Note: we remove an item once we clean it.
	 */
	checkCurrentLocationForDirt()
	{
		if ( this.lookUpArray[this.currentLoc.x][this.currentLoc.y])
		{
			this.lookUpArray[this.currentLoc.x][this.currentLoc.y] = null;
			return true;
		}else
		{
			return false;
		}
	}
	
	/**
	 *The input file is read as a single string. This function parses down this string to its components.
	 */
	parseInputText()
	{
		let inputText = this.fileContents.split(/[\r\n]+/);
		
		if(inputText.length < 4)
		{
			throw("Input File does not have enough rows to be valid.");
		}
		
		this.dimensions = new point(inputText[0]);
		
		if (this.dimensions.x <= 0 || this.dimensions.y <= 0)
		{
			throw("Dimensions cannot be 0 or negative. Input: " + this.dimensions.toString() );
		}
		//Setup the 'hash' table for quick lookups. For larger files this might be an issue in browsers.
		this.lookUpArray = [...Array(this.dimensions.x)].map(e => Array(this.dimensions.y));
		
		this.startLoc = new point(inputText[1]);
		this.currentLoc = this.startLoc;
		
		this.navString = inputText[inputText.length - 1];
		
		//Parse dirt locations and add them to 'hash' table.
		this.dirtLocations = inputText.slice(2,inputText.length - 1).map((e) => {
			let dirt = new point(e);
			
			if(dirt.x >= this.dimensions.x || dirt.y >= this.dimensions.y)
			{
				throw("Dirt Point is outside of bounds. Dirt Point : " + dirt.toString());
			}
			
			this.lookUpArray[dirt.x][dirt.y] = dirt;
			return dirt;
		});
	}
	
	/**
	 *Create a promise to monitor the state of the file being read.
	 *The culmination of this process will decide on terminating the process
	 *or running the rest of the program.
	 */
	readFile(file)
	{
		let reader = new FileReader();
		
		let fileReadPromise = new Promise(
			function(resolve, reject)
			{
				reader.onerror = function(e)
				{
					reject(new DOMException("Issue Reading File. Error Code : " + e.target.error.code));
				};
				
				reader.onload = function(event)
				{
					resolve(event.target.result);
				};
				
				reader.readAsText(file);
			});
		
		return fileReadPromise;
	}
}

/**
 *Helper function to grab the file element from the HTML.
 */
function processFile(event)
{
	let roombaSolver = new Roomba();
	roombaSolver.activate(event.target.files[0]);
}
