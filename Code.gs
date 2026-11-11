/**
 * HOTEL CLARKS AMER JAIPUR - SECURITY STAFF MANAGEMENT V3
 * Backend: Google Apps Script | Database: Google Sheets
 * Mandatory approval flow: Staff -> CSO -> HR -> Final Approved
 * ODC fixed rate: INR 500 / 8 hours = INR 62.50 per hour.
 */
const CFG = {
  SPREADSHEET_ID: '', // Leave blank for container-bound script; otherwise paste spreadsheet ID.
  APPROVAL_EMAIL: 'raazchoudhary765@gmail.com',
  ODC_RATE_8_HOURS: 500,
  ODC_HOURS_BASE: 8,
  SESSION_SECONDS: 21600,
  TZ: 'Asia/Kolkata'
};
const HEADERS = {
  STAFF_MASTER:['EMPLOYEE_ID','EMPLOYEE_NAME','DESIGNATION','EMPLOYMENT_TYPE','DEPARTMENT','MOBILE_NUMBER','EMAIL','JOINING_DATE','EMPLOYMENT_STATUS','PROFILE_PHOTO_URL','CREATED_AT'],
  USER_MASTER:['USER_ID','EMPLOYEE_ID','USERNAME','PASSWORD_HASH','ROLE','EMAIL','ACCESS_STATUS','LAST_LOGIN','CREATED_AT'],
  VENUE_MASTER:['VENUE_ID','VENUE_NAME','VENUE_STATUS'],
  EVENT_MASTER:['EVENT_ID','EVENT_NAME','EVENT_STATUS'],
  ADJUSTMENT_REQUESTS:['REQUEST_ID','REQUEST_DATE','EMPLOYEE_ID','EMPLOYEE_NAME','ADJUSTMENT_TYPE','TRANSACTION_TYPE','DUTY_DATE','ADJUSTMENT_DATE','QUANTITY_DAYS','REASON','REMARKS','ATTACHMENT_URL','CSO_STATUS','CSO_REMARKS','CSO_APPROVED_BY','CSO_APPROVED_AT','HR_STATUS','HR_REMARKS','HR_APPROVED_BY','HR_APPROVED_AT','FINAL_STATUS','CREATED_BY','CREATED_AT','UPDATED_AT'],
  ODC_RECORDS:['ODC_ID','REQUEST_DATE','EMPLOYEE_ID','EMPLOYEE_NAME','EVENT_NAME','VENUE_NAME','ODC_DATE','DUTY_START_TIME','DUTY_END_TIME','DUTY_HOURS','RATE_PER_HOUR','ODC_AMOUNT','REMARKS','PROOF_URL','CSO_STATUS','CSO_REMARKS','CSO_APPROVED_BY','CSO_APPROVED_AT','HR_STATUS','HR_REMARKS','HR_APPROVED_BY','HR_APPROVED_AT','FINAL_STATUS','PAYMENT_STATUS','PAYMENT_DATE','PAYMENT_REFERENCE','CREATED_BY','CREATED_AT','UPDATED_AT'],
  APPROVAL_LOG:['LOG_ID','REFERENCE_ID','MODULE','EMPLOYEE_ID','APPROVAL_LEVEL','ACTION','OLD_STATUS','NEW_STATUS','ACTION_BY','ACTION_EMAIL','ACTION_AT','REMARKS'],
  ODC_PAYMENT_LOG:['PAYMENT_ID','ODC_ID','EMPLOYEE_ID','AMOUNT','PAYMENT_STATUS','PAYMENT_DATE','PAYMENT_REFERENCE','PAID_BY','REMARKS'],
  SETTINGS:['SETTING_KEY','SETTING_VALUE','DESCRIPTION','UPDATED_BY','UPDATED_AT']
};
const ROSTER=[
['SEC-001','Mr Ramjas','Executive','Onrole'],['SEC-002','Mr Rajkumar','SUP','Onrole'],
['SEC-003','Mr Sitaram','SUP','Onrole'],['SEC-004','Mr Ravi','SUP','Onrole'],
['SEC-005','Mr Vishram','SUP','Onrole'],['SEC-006','Mr Omveer','SUP','Onrole'],
['SEC-007','Mr Rajesh Sharma','SUP','Onrole'],['SEC-008','Mr Ram Kumar','SUP','Onrole'],
['SEC-009','Mr Surendra Singh','SUP CCTV','Onrole'],['SEC-010','Satish Chand','Security Guard','Onrole'],
['SEC-011','Mohar Singh','Security Guard','Onrole'],['SEC-012','Surendra Sharma','Security Guard','Onrole'],
['SEC-013','Mansoory Meena','Lady Guard','Onrole'],['SEC-014','Rajendra','Doorman','Casual'],
['SEC-015','Ranveer','Security Guard','Casual'],['SEC-016','Ved Parkash','Security Guard','Casual'],
['SEC-017','Dayal Meena','Security Guard','Casual'],['SEC-018','Bhagchand','Security Guard','Casual'],
['SEC-019','Pappu Lal','Security Guard','Casual'],['SEC-020','Mukesh Meena','Security Guard','Casual'],
['SEC-021','Nisha Meena','Lady Guard','Casual'],['SEC-022','Santosh','Lady Guard','Casual'],
['SEC-023','Mr Roop Kishor','Security Guard','Casual']
];
const VENUES=['Virendra Mahal','Rani Mahal','Darbar','Swarn Mahal','Surya Mahal','Party Hall','Root Hall','Jal Mahal','CBCC Hall','Rama Bagh','Semel Bagh','Porch','MDP','KTP','BSP','Chauraha'];
const EVENTS=['Marriage Function','Marriage Anniversary','Birthday Function','Conference','BNI','Hi-Tea','Seminar','Sunday Market','JLF','Jaipur Dialogue','Other'];

function ss_(){return CFG.SPREADSHEET_ID?SpreadsheetApp.openById(CFG.SPREADSHEET_ID):SpreadsheetApp.getActiveSpreadsheet();}
function doGet(){return HtmlService.createHtmlOutputFromFile('Index').setTitle('Clarks Amer Security Management').addMetaTag('viewport','width=device-width, initial-scale=1');}
function setupDatabase(){
  const ss=ss_();
  Object.keys(HEADERS).forEach(n=>{
    let sh=ss.getSheetByName(n);if(!sh)sh=ss.insertSheet(n);
    const h=HEADERS[n];
    if(sh.getLastRow()===0)sh.getRange(1,1,1,h.length).setValues([h]);
    else h.forEach((v,i)=>{if(sh.getRange(1,i+1).getDisplayValue()!==v)sh.getRange(1,i+1).setValue(v);});
    sh.setFrozenRows(1);sh.getRange(1,1,1,h.length).setBackground('#102b45').setFontColor('#ffffff').setFontWeight('bold');
  });
  seedList_('VENUE_MASTER',VENUES,'VEN');seedList_('EVENT_MASTER',EVENTS,'EVT');seedRoster_();seedSettings_();
  return 'Database ready: '+ss.getUrl();
}
function seedList_(sheet,names,prefix){
  const sh=ss_().getSheetByName(sheet),have=sh.getLastRow()>1?sh.getRange(2,2,sh.getLastRow()-1,1).getDisplayValues().flat():[];
  names.forEach((n,i)=>{if(!have.includes(n))sh.appendRow([prefix+'-'+String(i+1).padStart(3,'0'),n,'ACTIVE']);});
}
function seedRoster_(){
  const sh=ss_().getSheetByName('STAFF_MASTER');if(sh.getLastRow()>1)return;
  ROSTER.forEach(r=>sh.appendRow([r[0],r[1],r[2],r[3],'SECURITY','','','','ACTIVE','',new Date()]));
}
function seedSettings_(){
  const sh=ss_().getSheetByName('SETTINGS'),have=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,1).getDisplayValues().flat():[];
  [['ODC_RATE_8_HOURS','500','Fixed cash rate for 8 hours'],['ODC_HOURS_BASE','8','Base duty hours'],['ODC_RATE_PER_HOUR','62.50','500 divided by 8'],['APPROVAL_EMAIL',CFG.APPROVAL_EMAIL,'Approval notification address'],['APPROVAL_FLOW','CSO_THEN_HR','Mandatory for all CO, Weekly Off and ODC requests']].forEach(r=>{if(!have.includes(r[0]))sh.appendRow([...r,'SYSTEM',new Date()]);});
}
function rows_(name){
  const sh=ss_().getSheetByName(name);if(!sh||sh.getLastRow()<2)return [];
  const a=sh.getDataRange().getValues(),h=a.shift().map(String);
  return a.filter(r=>r.some(v=>v!==''&&v!==null)).map(r=>{const o={};h.forEach((k,i)=>o[k]=r[i] instanceof Date?Utilities.formatDate(r[i],CFG.TZ,'dd-MM-yyyy HH:mm:ss'):r[i]);return o;});
}
function append_(name,obj){const sh=ss_().getSheetByName(name);sh.appendRow(HEADERS[name].map(k=>obj[k]===undefined?'':obj[k]));}
function patch_(name,key,value,changes){
  const sh=ss_().getSheetByName(name),v=sh.getDataRange().getValues(),h=v[0].map(String),ki=h.indexOf(key);
  for(let r=1;r<v.length;r++)if(String(v[r][ki])===String(value)){Object.keys(changes).forEach(k=>{const c=h.indexOf(k);if(c>=0)sh.getRange(r+1,c+1).setValue(changes[k]);});return true;}return false;
}
function newId_(p){return p+'-'+Utilities.formatDate(new Date(),CFG.TZ,'yyyyMMdd-HHmmss')+'-'+Math.floor(1000+Math.random()*9000);}
function hash_(p,salt){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,salt+'|'+p,Utilities.Charset.UTF_8).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');}
function createUserFromEditor_(username,password,role,employeeId,email){
  role=String(role).toUpperCase();if(!['ADMIN','CSO','HR','STAFF'].includes(role))throw Error('Invalid role.');
  if(!username||!password||password.length<12)throw Error('Use username and a password of at least 12 characters.');
  if(rows_('USER_MASTER').some(x=>String(x.USERNAME).toLowerCase()===String(username).toLowerCase()))throw Error('Username already exists.');
  if(role==='STAFF'&&!rows_('STAFF_MASTER').some(x=>String(x.EMPLOYEE_ID)===String(employeeId)))throw Error('Employee ID not found.');
  const salt=Utilities.getUuid();append_('USER_MASTER',{USER_ID:newId_('USR'),EMPLOYEE_ID:employeeId||'',USERNAME:username,PASSWORD_HASH:salt+':'+hash_(password,salt),ROLE:role,EMAIL:email||'',ACCESS_STATUS:'ACTIVE',CREATED_AT:new Date()});
  return 'Created '+role+' user '+username;
}
function login(username,password){
  const u=rows_('USER_MASTER').find(x=>String(x.USERNAME).toLowerCase()===String(username||'').toLowerCase()&&x.ACCESS_STATUS==='ACTIVE');
  if(!u)throw Error('Invalid login.');const z=String(u.PASSWORD_HASH).split(':');
  if(z.length!==2||hash_(String(password||''),z[0])!==z[1])throw Error('Invalid login.');
  const token=Utilities.getUuid()+Utilities.getUuid(),safe={userId:u.USER_ID,employeeId:u.EMPLOYEE_ID,username:u.USERNAME,role:u.ROLE,email:u.EMAIL};
  CacheService.getScriptCache().put('s_'+token,JSON.stringify(safe),CFG.SESSION_SECONDS);
  patch_('USER_MASTER','USER_ID',u.USER_ID,{LAST_LOGIN:new Date()});return {token,user:safe};
}
function user_(token){const x=CacheService.getScriptCache().get('s_'+token);if(!x)throw Error('Session expired. Login again.');return JSON.parse(x);}
function need_(u,roles){if(!roles.includes(u.role))throw Error('Access denied.');}
function sendMail_(subject,body){
  try{MailApp.sendEmail({to:CFG.APPROVAL_EMAIL,subject:subject,body:body,name:'Clarks Amer Security Management'});}
  catch(e){console.error('Mail error: '+e.message);}
}
function log_(ref,module,emp,level,action,oldS,newS,u,remarks){
  append_('APPROVAL_LOG',{LOG_ID:newId_('LOG'),REFERENCE_ID:ref,MODULE:module,EMPLOYEE_ID:emp,APPROVAL_LEVEL:level,ACTION:action,OLD_STATUS:oldS,NEW_STATUS:newS,ACTION_BY:u.username,ACTION_EMAIL:u.email||'',ACTION_AT:new Date(),REMARKS:remarks||''});
}
function apiInit(token){
  const u=user_(token);let staff=rows_('STAFF_MASTER').filter(x=>x.EMPLOYMENT_STATUS==='ACTIVE');
  if(u.role==='STAFF')staff=staff.filter(x=>String(x.EMPLOYEE_ID)===String(u.employeeId));
  const odc=rows_('ODC_RECORDS'),adj=rows_('ADJUSTMENT_REQUESTS');
  return {user:u,staff,venues:rows_('VENUE_MASTER'),events:rows_('EVENT_MASTER'),dashboard:{
    totalStaff:rows_('STAFF_MASTER').filter(x=>x.EMPLOYMENT_STATUS==='ACTIVE').length,
    onrole:rows_('STAFF_MASTER').filter(x=>x.EMPLOYMENT_STATUS==='ACTIVE'&&x.EMPLOYMENT_TYPE==='Onrole').length,
    casual:rows_('STAFF_MASTER').filter(x=>x.EMPLOYMENT_STATUS==='ACTIVE'&&x.EMPLOYMENT_TYPE==='Casual').length,
    coPending:adj.filter(x=>x.ADJUSTMENT_TYPE==='COMPENSATORY_OFF'&&x.FINAL_STATUS!=='APPROVED').length,
    woPending:adj.filter(x=>x.ADJUSTMENT_TYPE==='WEEKLY_OFF'&&x.FINAL_STATUS!=='APPROVED').length,
    odcCount:odc.length,odcPending:odc.filter(x=>x.PAYMENT_STATUS!=='PAID').reduce((s,x)=>s+Number(x.ODC_AMOUNT||0),0),
    odcPaid:odc.filter(x=>x.PAYMENT_STATUS==='PAID').reduce((s,x)=>s+Number(x.ODC_AMOUNT||0),0),
    approvalPending:adj.filter(x=>x.FINAL_STATUS!=='APPROVED'&&x.FINAL_STATUS!=='REJECTED').length+odc.filter(x=>x.FINAL_STATUS!=='APPROVED'&&x.FINAL_STATUS!=='REJECTED').length
  }};
}
function apiSubmitAdjustment(token,d){
  const u=user_(token),type=String(d.ADJUSTMENT_TYPE||'');
  if(!['COMPENSATORY_OFF','WEEKLY_OFF'].includes(type))throw Error('Invalid adjustment type.');
  const emp=rows_('STAFF_MASTER').find(x=>String(x.EMPLOYEE_ID)===String(d.EMPLOYEE_ID));if(!emp)throw Error('Staff not found.');
  if(u.role==='STAFF'&&String(u.employeeId)!==String(emp.EMPLOYEE_ID))throw Error('You can submit only your own request.');
  const q=Number(d.QUANTITY_DAYS);if(!(q>0))throw Error('Quantity must be positive.');
  const id=newId_('ADJ'),now=new Date();
  append_('ADJUSTMENT_REQUESTS',{REQUEST_ID:id,REQUEST_DATE:now,EMPLOYEE_ID:emp.EMPLOYEE_ID,EMPLOYEE_NAME:emp.EMPLOYEE_NAME,ADJUSTMENT_TYPE:type,TRANSACTION_TYPE:d.TRANSACTION_TYPE||'EARNED',DUTY_DATE:d.DUTY_DATE||'',ADJUSTMENT_DATE:d.ADJUSTMENT_DATE||'',QUANTITY_DAYS:q,REASON:d.REASON||'',REMARKS:d.REMARKS||'',ATTACHMENT_URL:d.ATTACHMENT_URL||'',CSO_STATUS:'PENDING',HR_STATUS:'WAITING_FOR_CSO',FINAL_STATUS:'PENDING_CSO',CREATED_BY:u.username,CREATED_AT:now,UPDATED_AT:now});
  sendMail_('Approval required: '+type+' / '+emp.EMPLOYEE_NAME,'A new request requires CSO and HR approval.\nRequest: '+id+'\nEmployee: '+emp.EMPLOYEE_NAME+'\nType: '+type+'\nQuantity: '+q+'\nSubmitted by: '+u.username);
  return {id};
}
function apiSubmitODC(token,d){
  const u=user_(token),emp=rows_('STAFF_MASTER').find(x=>String(x.EMPLOYEE_ID)===String(d.EMPLOYEE_ID));if(!emp)throw Error('Staff not found.');
  if(u.role==='STAFF'&&String(u.employeeId)!==String(emp.EMPLOYEE_ID))throw Error('You can submit only your own ODC.');
  const hours=Number(d.DUTY_HOURS);if(!(hours>0)||hours>24)throw Error('Duty hours must be greater than 0 and not exceed 24.');
  const rate=CFG.ODC_RATE_8_HOURS/CFG.ODC_HOURS_BASE,amount=Math.round(hours*rate*100)/100,id=newId_('ODC'),now=new Date();
  append_('ODC_RECORDS',{ODC_ID:id,REQUEST_DATE:now,EMPLOYEE_ID:emp.EMPLOYEE_ID,EMPLOYEE_NAME:emp.EMPLOYEE_NAME,EVENT_NAME:d.EVENT_NAME||'',VENUE_NAME:d.VENUE_NAME||'',ODC_DATE:d.ODC_DATE||'',DUTY_START_TIME:d.DUTY_START_TIME||'',DUTY_END_TIME:d.DUTY_END_TIME||'',DUTY_HOURS:hours,RATE_PER_HOUR:rate,ODC_AMOUNT:amount,REMARKS:d.REMARKS||'',PROOF_URL:d.PROOF_URL||'',CSO_STATUS:'PENDING',HR_STATUS:'WAITING_FOR_CSO',FINAL_STATUS:'PENDING_CSO',PAYMENT_STATUS:'PENDING',CREATED_BY:u.username,CREATED_AT:now,UPDATED_AT:now});
  sendMail_('ODC cash approval required: '+emp.EMPLOYEE_NAME,'ODC request requires CSO and HR approval.\nODC ID: '+id+'\nEmployee: '+emp.EMPLOYEE_NAME+'\nEvent: '+(d.EVENT_NAME||'')+'\nVenue: '+(d.VENUE_NAME||'')+'\nHours: '+hours+'\nRate: INR '+rate+'/hour\nCalculated cash: INR '+amount);
  return {id,rate,amount};
}
function apiApprove(token,ref,module,decision,remarks){
  const u=user_(token);if(!['CSO','HR','ADMIN'].includes(u.role))throw Error('Approval access denied.');
  const table=module==='ODC'?'ODC_RECORDS':'ADJUSTMENT_REQUESTS',key=module==='ODC'?'ODC_ID':'REQUEST_ID';
  const rec=rows_(table).find(x=>String(x[key])===String(ref));if(!rec)throw Error('Record not found.');
  decision=String(decision).toUpperCase();if(!['APPROVE','REJECT','RETURN'].includes(decision))throw Error('Invalid decision.');
  const now=new Date(),status=decision==='APPROVE'?'APPROVED':decision==='REJECT'?'REJECTED':'RETURNED';
  if(u.role==='CSO'||u.role==='ADMIN'){
    if(rec.CSO_STATUS!=='PENDING')throw Error('Not pending CSO approval.');
    patch_(table,key,ref,{CSO_STATUS:status,CSO_REMARKS:remarks||'',CSO_APPROVED_BY:u.username,CSO_APPROVED_AT:now,HR_STATUS:decision==='APPROVE'?'PENDING':'NOT_REQUIRED',FINAL_STATUS:decision==='APPROVE'?'PENDING_HR':status,UPDATED_AT:now});
    log_(ref,module,rec.EMPLOYEE_ID,'CSO',decision,'PENDING',status,u,remarks);
  } else {
    if(rec.CSO_STATUS!=='APPROVED'||rec.HR_STATUS!=='PENDING')throw Error('Only CSO-approved requests can be finally processed by HR.');
    patch_(table,key,ref,{HR_STATUS:status,HR_REMARKS:remarks||'',HR_APPROVED_BY:u.username,HR_APPROVED_AT:now,FINAL_STATUS:status,UPDATED_AT:now});
    log_(ref,module,rec.EMPLOYEE_ID,'HR',decision,'PENDING',status,u,remarks);
  }
  sendMail_('Approval update: '+ref,ref+' / '+module+' was '+status+' by '+u.username+'.\nRemarks: '+(remarks||'None')+'\nCurrent final status: '+(decision==='APPROVE'?(u.role==='HR'?'APPROVED':'PENDING_HR'):status));
  return {ok:true};
}
function apiMarkOdcPaid(token,odcId,paymentDate,reference,remarks){
  const u=user_(token);need_(u,['HR','ADMIN']);
  const r=rows_('ODC_RECORDS').find(x=>String(x.ODC_ID)===String(odcId));if(!r)throw Error('ODC not found.');
  if(r.FINAL_STATUS!=='APPROVED')throw Error('ODC must receive both CSO and HR approval before payment.');
  if(r.PAYMENT_STATUS==='PAID')throw Error('Already marked paid.');
  const now=new Date();patch_('ODC_RECORDS','ODC_ID',odcId,{PAYMENT_STATUS:'PAID',PAYMENT_DATE:paymentDate||now,PAYMENT_REFERENCE:reference||'',UPDATED_AT:now});
  append_('ODC_PAYMENT_LOG',{PAYMENT_ID:newId_('PAY'),ODC_ID:odcId,EMPLOYEE_ID:r.EMPLOYEE_ID,AMOUNT:r.ODC_AMOUNT,PAYMENT_STATUS:'PAID',PAYMENT_DATE:paymentDate||now,PAYMENT_REFERENCE:reference||'',PAID_BY:u.username,REMARKS:remarks||''});
  sendMail_('ODC payment marked paid: '+odcId,'Employee: '+r.EMPLOYEE_NAME+'\nAmount: INR '+r.ODC_AMOUNT+'\nPayment reference: '+(reference||'Not provided'));
  return {ok:true};
}
function apiList(token,module){
  const u=user_(token);let data=rows_(module==='ODC'?'ODC_RECORDS':module==='STAFF'?'STAFF_MASTER':module==='LOG'?'APPROVAL_LOG':'ADJUSTMENT_REQUESTS');
  if(u.role==='STAFF')data=data.filter(x=>String(x.EMPLOYEE_ID)===String(u.employeeId));
  return data.slice(-500).reverse();
}
