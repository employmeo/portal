// Stub Functions to be removed 
function getHistoryData() {
	var redflagColor = "#d9534f";
	var redflagOverlay = "rgba(217, 83, 79,0.3)";
	var redflagHighlight = "#d43f3a";

	var churnerColor = "#f0ad4e";
	var churnerOverlay = "rgba(240, 173, 78, 0.3)";
	var churnerHighlight = "#eea236";

	var longtimerColor = "#5bc0de";
	var longtimerOverlay = "rgba(91, 192, 222,0.3)";
	var longtimerHighlight = "#46b8da";

	var risingstarColor = "#5cb85c";
	var risingstarOverlay = "rgba(92, 184, 92,0.3)";
	var risingstarHighlight = "#4cae4c";

	var applicantColor = "rgba(120,60,100,1)";
	var applicantOverlay = "rgba(120,60,100,0.3)";
	var applicantHighlight = "rgba(120,60,100,1)";
	return {
	    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
	    datasets: [
	        {
	            label: "Red Flag",
	            backgroundColor: redflagColor,
	            borderColor: redflagColor,
	            hoverBackgroundColor: redflagOverlay,
	            hoverBorderColor: redflagHighlight,
	            data: [10,2,3,2,1,2,1,2,1,0,0,1]
	        },
	        {
	            label: "Churner",
	            backgroundColor: churnerColor,
	            borderColor: churnerColor,
	            hoverBackgroundColor: churnerOverlay,
	            hoverBorderColor: churnerHighlight,
	            data: [140,150,130,110,130,102,110,90,80,85,80,75]
	        },
	        {
	            label: "Long Timer",
	            backgroundColor: longtimerColor,
	            borderColor: longtimerColor,
	            hoverBackgroundColor: longtimerOverlay,
	            hoverBorderColor: longtimerHighlight,
	            data: [50,55,65,71,86,100,104,120,112,121,118,126]
	        },
	        {
	            label: "Rising Star",
	            backgroundColor: risingstarColor,
	            borderColor: risingstarColor,
	            hoverBackgroundColor: risingstarOverlay,
	            hoverBorderColor: risingstarHighlight,
	            data: [3,5,7,8,7,12,13,17,20,21,22,21]
	        }
	    ]
	};
}

//function dData () {
//	  return Math.round(Math.random() * 10) + 1
//};

function getStubDataForRoleBenchmark() {
	
	var person = {
		first_name : 'John',
		cf : {
			0:{"cf_name":"Work Ethic","value":15},
			1:{"cf_name":"Perseverence","value":20},
			2:{"cf_name":"Prior Experience","value":30},
			3:{"cf_name":"Referral","value":40},
			4:{"cf_name":"Commute","value":45},
			5:{"cf_name":"Job History","value":45},
			6:{"cf_name":"Personal Relationship","value":45}
		}
	};
	var role_benchmark = {
		role_name : 'Crew',
		role_description : 'Crew is an entry level position. Required basic work skills and ability to read / speak English.',
		applicant_count : '1300',
		hire_count : '300',
		role_grade : {
			0:{"grade":"profile_a","n0":"tenure","v0":"9.3","n1":"wage_increase","v1":".034"},
			1:{"grade":"profile_b","n0":"tenure","v0":"8.2","n1":"wage_increase","v1":".021"},
			2:{"grade":"profile_c","n0":"tenure","v0":"5.7","n1":"wage_increase","v1":".014"},
			3:{"grade":"profile_d","n0":"tenure","v0":"2.4","n1":"wage_increase","v1":".020"}
		},
		cf : {0:{"cf_name":"Work Ethic","value":15},1:{"cf_name":"Perseverence","value":20},2:{"cf_name":"Prior Experience","value":30},3:{"cf_name":"Referral","value":40},4:{"cf_name":"Commute","value":45},5:{"cf_name":"Job History","value":45},6:{"cf_name":"Personal Relationship","value":45}},
		date : 'Oct 14, 2016'
	};
	return {'person' : person, 'role_benchmark' : role_benchmark };
}

function stubCorefactors(corefactors) {
	var length = 5;
	var factors = [];
	
	for (var i = 0;i<length;i++) {
		factors[i] = corefactors[Math.floor(Math.random()*corefactors.length)];
		factors[i].score = Math.floor(Math.random()*7)+4;
		if (factors[i].displayGroup == null) factors[i].displayGroup = "Other";
	}
	return factors;
};

function getPredictionMean(prediction) {
	switch (prediction.positionPredictionConfig.predictionModelId) {
		case 1:
			return .48;
			break;
		case 2:
			return .31
			break;
		case 3:
		default:
			return .19;
			break;
		
	}
}

function getPredictionStDev(prediction) {
	switch (prediction.positionPredictionConfig.predictionModelId) {
	case 1:
		return .052;
		break;
	case 2:
		return .047;
		break;
	case 3:
	default:
		return .038;
		break;	
	}
}
