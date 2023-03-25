/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/error', 'N/record', 'N/search'],
/**
 * @param {error} error
 * @param {record} record
 * @param {search} search
 */
function(error, record, search) {
   

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(context) {
        var newRecord = context.newRecord;
        var taxCode = 303;
        
        try{
          
            log.debug('beforeSubmit', 'Record Type-'+context.newRecord.type);

            var shipAddr1 = newRecord.getValue('custbody_ut_cm_ship_addr1');
            var shipAddr2 = newRecord.getValue('custbody_ut_cm_ship_addr2');
            var shipCity = newRecord.getValue('custbody_ut_cm_ship_city');
            var shipState = newRecord.getValue('custbody_ut_cm_ship_state');
            var shipZip = newRecord.getValue('custbody_ut_cm_ship_zip');
            var shipCountry =  newRecord.getValue('custbody_ut_cm_ship_country');
          
            // Set values on the subrecord.
            // Set country field first when script uses dynamic mode
            if ((shipCountry != null && shipCountry != '') && (shipAddr1 != null && shipAddr1 != '') && (context.newRecord.type == 'creditmemo'))
            {

              
              shipCntry =  countries_list[shipCountry];
            // Create the subrecord.
              var subrec = newRecord.getSubrecord({
                fieldId: 'shippingaddress'
              });                
              
              //log.debug('beforesubmit','shipaddress-' + subrec.getValue('addr1'));
            newRecord.setValue({
			fieldId: 'shipaddress',
			value:''
			});
               subrec.setValue({
                  fieldId: 'override',
                  value: false
                });
              subrec.setValue({
                  fieldId: 'country',
                  value: shipCntry
                });

                subrec.setValue({
                  fieldId: 'city',
                  value: shipCity
                });

                subrec.setValue({
                  fieldId: 'state',
                  value: shipState
                });

                subrec.setValue({
                  fieldId: 'zip',
                  value: shipZip
                });

                subrec.setValue({
                  fieldId: 'addr2',
                  value: shipAddr2
                });

                subrec.setValue({
                  fieldId: 'addr1',
                  value: shipAddr1
                });

              
              
            }
          
	        var itemLineCount = newRecord.getLineCount({
	            sublistId: 'item'
	        });
	        log.debug('LineCount', itemLineCount);
	        for (var i=0; itemLineCount != 0 && i < itemLineCount; i++){
	            var taxRate = parseFloat(newRecord.getSublistValue({sublistId: 'item', fieldId: 'custcol_ut_sfdc_tax_rate', line: i}));
	            log.debug('beforeSubmit', 'taxRate-'+taxRate);

	            if (taxRate != null && taxRate != '' && !isNaN(taxRate))
	            {
	                newRecord.setSublistValue({sublistId: 'item', fieldId: 'taxcode', line: i, value: taxCode});
	                newRecord.setSublistValue({sublistId: 'item', fieldId: 'taxrate1', line: i, value: taxRate});
	            }
	            else
	            {
	                newRecord.setSublistValue({sublistId: 'item', fieldId: 'taxcode', line: i, value: taxCode});
	                newRecord.setSublistValue({sublistId: 'item', fieldId: 'taxrate1', line: i, value: 0});

	            }
		
	        }
        }
        catch(e)
        {
            log.error('beforeSubmit', JSON.parse(JSON.stringify(e)));
        }
    }

  var countries_list = 
  {
    _afghanistan: 'AF',
    _alandIslands: 'AX',
    _albania: 'AL',
    _algeria: 'DZ',
    _americanSamoa: 'AS',
    _andorra: 'AD',
    _angola: 'AO',
    _anguilla: 'AI',
    _antarctica: 'AQ',
    _antiguaAndBarbuda: 'AG',
    _argentina: 'AR',
    _armenia: 'AM',
    _aruba: 'AW',
    _australia: 'AU',
    _austria: 'AT',
    _azerbaijan: 'AZ',
    _bahamas: 'BS',
    _bahrain: 'BH',
    _bangladesh: 'BD',
    _barbados: 'BB',
    _belarus: 'BY',
    _belgium: 'BE',
    _belize: 'BZ',
    _benin: 'BJ',
    _bermuda: 'BM',
    _bhutan: 'BT',
    _bolivia: 'BO',
    _bonaireSaintEustatiusAndSaba: 'BQ',
    _bosniaAndHerzegovina: 'BA',
    _botswana: 'BW',
    _bouvetIsland: 'BV',
    _brazil: 'BR',
    _britishIndianOceanTerritory: 'IO',
    _bruneiDarussalam: 'BN',
    _bulgaria: 'BG',
    _burkinaFaso: 'BF',
    _burundi: 'BI',
    _cambodia: 'KH',
    _cameroon: 'CM',
    _canada: 'CA',
    _canaryIslands: 'IC',
    _capeVerde: 'CV',
    _caymanIslands: 'KY',
    _centralAfricanRepublic: 'CF',
    _ceutaAndMelilla: 'EA',
    _chad: 'TD',
    _chile: 'CL',
    _china: 'CN',
    _christmasIsland: 'CX',
    _cocosKeelingIslands: 'CC',
    _colombia: 'CO',
    _comoros: 'KM',
    _congoDemocraticPeoplesRepublic: 'CD',
    _congoRepublicOf: 'CG',
    _cookIslands: 'CK',
    _costaRica: 'CR',
    _coteDIvoire: 'CI',
    _croatiaHrvatska: 'HR',
    _cuba: 'CU',
    _curacao: 'CW',
    _cyprus: 'CY',
    _czechRepublic: 'CZ',
    _denmark: 'DK',
    _djibouti: 'DJ',
    _dominica: 'DM',
    _dominicanRepublic: 'DO',
    _eastTimor: 'TL',
    _ecuador: 'EC',
    _egypt: 'EG',
    _elSalvador: 'SV',
    _equatorialGuinea: 'GQ',
    _eritrea: 'ER',
    _estonia: 'EE',
    _ethiopia: 'ET',
    _falklandIslands: 'FK',
    _faroeIslands: 'FO',
    _fiji: 'FJ',
    _finland: 'FI',
    _france: 'FR',
    _frenchGuiana: 'GF',
    _frenchPolynesia: 'PF',
    _frenchSouthernTerritories: 'TF',
    _gabon: 'GA',
    _gambia: 'GM',
    _georgia: 'GE',
    _germany: 'DE',
    _ghana: 'GH',
    _gibraltar: 'GI',
    _greece: 'GR',
    _greenland: 'GL',
    _grenada: 'GD',
    _guadeloupe: 'GP',
    _guam: 'GU',
    _guatemala: 'GT',
    _guernsey: 'GG',
    _guinea: 'GN',
    _guineaBissau: 'GW',
    _guyana: 'GY',
    _haiti: 'HT',
    _heardAndMcDonaldIslands: 'HM',
    _holySeeCityVaticanState: 'VA',
    _honduras: 'HN',
    _hongKong: 'HK',
    _hungary: 'HU',
    _iceland: 'IS',
    _india: 'IN',
    _indonesia: 'ID',
    _iranIslamicRepublicOf: 'IR',
    _iraq: 'IQ',
    _ireland: 'IE',
    _isleOfMan: 'IM',
    _israel: 'IL',
    _italy: 'IT',
    _jamaica: 'JM',
    _japan: 'JP',
    _jersey: 'JE',
    _jordan: 'JO',
    _kazakhstan: 'KZ',
    _kenya: 'KE',
    _kiribati: 'KI',
    _koreaDemocraticPeoplesRepublic: 'KP',
    _koreaRepublicOf: 'KR',
    _kosovo: 'XK',
    _kuwait: 'KW',
    _kyrgyzstan: 'KG',
    _laoPeoplesDemocraticRepublic: 'LA',
    _latvia: 'LV',
    _lebanon: 'LB',
    _lesotho: 'LS',
    _liberia: 'LR',
    _libya: 'LY',
    _liechtenstein: 'LI',
    _lithuania: 'LT',
    _luxembourg: 'LU',
    _macau: 'MO',
    _macedonia: 'MK',
    _madagascar: 'MG',
    _malawi: 'MW',
    _malaysia: 'MY',
    _maldives: 'MV',
    _mali: 'ML',
    _malta: 'MT',
    _marshallIslands: 'MH',
    _martinique: 'MQ',
    _mauritania: 'MR',
    _mauritius: 'MU',
    _mayotte: 'YT',
    _mexico: 'MX',
    _micronesiaFederalStateOf: 'FM',
    _moldovaRepublicOf: 'MD',
    _monaco: 'MC',
    _mongolia: 'MN',
    _montenegro: 'ME',
    _montserrat: 'MS',
    _morocco: 'MA',
    _mozambique: 'MZ',
    _myanmar: 'MM',
    _namibia: 'NA',
    _nauru: 'NR',
    _nepal: 'NP',
    _netherlands: 'NL',
    _newCaledonia: 'NC',
    _newZealand: 'NZ',
    _nicaragua: 'NI',
    _niger: 'NE',
    _nigeria: 'NG',
    _niue: 'NU',
    _norfolkIsland: 'NF',
    _northernMarianaIslands: 'MP',
    _norway: 'NO',
    _oman: 'OM',
    _pakistan: 'PK',
    _palau: 'PW',
    _panama: 'PA',
    _papuaNewGuinea: 'PG',
    _paraguay: 'PY',
    _peru: 'PE',
    _philippines: 'PH',
    _pitcairnIsland: 'PN',
    _poland: 'PL',
    _portugal: 'PT',
    _puertoRico: 'PR',
    _qatar: 'QA',
    _reunionIsland: 'RE',
    _romania: 'RO',
    _russianFederation: 'RU',
    _rwanda: 'RW',
    _saintBarthelemy: 'BL',
    _saintHelena: 'SH',
    _saintKittsAndNevis: 'KN',
    _saintLucia: 'LC',
    _saintMartin: 'MF',
    _saintVincentAndTheGrenadines: 'VC',
    _samoa: 'WS',
    _sanMarino: 'SM',
    _saoTomeAndPrincipe: 'ST',
    _saudiArabia: 'SA',
    _senegal: 'SN',
    _serbia: 'RS',
    _seychelles: 'SC',
    _sierraLeone: 'SL',
    _singapore: 'SG',
    _sintMaarten: 'SX',
    _slovakRepublic: 'SK',
    _slovenia: 'SI',
    _solomonIslands: 'SB',
    _somalia: 'SO',
    _southAfrica: 'ZA',
    _southGeorgia: 'GS',
    _southSudan: 'SS',
    _spain: 'ES',
    _sriLanka: 'LK',
    _stateOfPalestine: 'PS',
    _stPierreAndMiquelon: 'PM',
    _sudan: 'SD',
    _suriname: 'SR',
    _svalbardAndJanMayenIslands: 'SJ',
    _swaziland: 'SZ',
    _sweden: 'SE',
    _switzerland: 'CH',
    _syrianArabRepublic: 'SY',
    _taiwan: 'TW',
    _tajikistan: 'TJ',
    _tanzania: 'TZ',
    _thailand: 'TH',
    _togo: 'TG',
    _tokelau: 'TK',
    _tonga: 'TO',
    _trinidadAndTobago: 'TT',
    _tunisia: 'TN',
    _turkey: 'TR',
    _turkmenistan: 'TM',
    _turksAndCaicosIslands: 'TC',
    _tuvalu: 'TV',
    _uganda: 'UG',
    _ukraine: 'UA',
    _unitedArabEmirates: 'AE',
    _unitedKingdom: 'GB',
    _unitedStates: 'US',
    _uruguay: 'UY',
    _uSMinorOutlyingIslands: 'UM',
    _uzbekistan: 'UZ',
    _vanuatu: 'VU',
    _venezuela: 'VE',
    _vietnam: 'VN',
    _virginIslandsBritish: 'VG',
    _virginIslandsUSA: 'VI',
    _wallisAndFutunaIslands: 'WF',
    _westernSahara: 'EH',
    _yemen: 'YE',
    _zambia: 'ZM',
    _zimbabwe: 'ZW'
  }

    return {
        beforeSubmit: beforeSubmit
    };
    
});
