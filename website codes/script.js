const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const today = new Date(); const isoToday = today.toISOString().slice(0,10);
const defaultDoctors = [
 {id:1,name:"Dr. Ananya Rao",specialty:"Cardiology",experience:"12 years",fee:700,days:["Monday","Tuesday","Thursday"],slots:["09:00","10:00","11:30","14:00","15:00"]},
 {id:2,name:"Dr. Rohan Mehta",specialty:"Dermatology",experience:"8 years",fee:500,days:["Monday","Wednesday","Friday"],slots:["09:30","10:30","12:00","14:30","16:00"]},
 {id:3,name:"Dr. Priya Nair",specialty:"Pediatrics",experience:"10 years",fee:600,days:["Tuesday","Wednesday","Saturday"],slots:["09:00","11:00","12:30","15:00"]},
 {id:4,name:"Dr. Arjun Iyer",specialty:"Orthopedics",experience:"15 years",fee:800,days:["Monday","Thursday","Saturday"],slots:["10:00","11:00","13:00","15:30"]},
 {id:5,name:"Dr. Meera Shah",specialty:"Neurology",experience:"9 years",fee:750,days:["Tuesday","Friday","Saturday"],slots:["09:30","11:30","14:00","16:00"]}
];
const load = (key, fallback) => {try{return JSON.parse(localStorage.getItem(key)) ?? fallback}catch{return fallback}};
let doctors = load("cp_doctors", defaultDoctors);
let bookings = load("cp_bookings", []);
let currentUser = load("cp_user", null);
let nextDoctorId = Math.max(0,...doctors.map(d=>d.id))+1;
const save = () => {localStorage.setItem("cp_doctors",JSON.stringify(doctors));localStorage.setItem("cp_bookings",JSON.stringify(bookings));localStorage.setItem("cp_user",JSON.stringify(currentUser));};
const esc = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const initials = name => name.split(" ").filter(Boolean).slice(-2).map(x=>x[0]).join("").toUpperCase();
const fmtDate = d => new Date(d+"T12:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
const weekday = d => new Date(d+"T12:00:00").toLocaleDateString("en-US",{weekday:"long"});
const prettyTime = t => {const [h,m]=t.split(":").map(Number);return new Date(2000,0,1,h,m).toLocaleTimeString("en-IN",{hour:"numeric",minute:"2-digit"});};
const patientBookings = () => bookings.filter(b=>currentUser && b.patientEmail===currentUser.email);
function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2600)}
function openModal(html){$("#modalContent").innerHTML=html;$("#modalBackdrop").classList.add("open");$("#modalBackdrop").setAttribute("aria-hidden","false")}
function closeModal(){$("#modalBackdrop").classList.remove("open");$("#modalBackdrop").setAttribute("aria-hidden","true")}
$("#modalClose").addEventListener("click",closeModal);
$("#modalBackdrop").addEventListener("click",e=>{if(e.target.id==="modalBackdrop")closeModal()});
function go(view){
  $$(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  $$(".view").forEach(v=>v.classList.toggle("active",v.id===`view-${view}`));
  const titles={dashboard:"Good day",doctors:"Find a doctor",appointments:"Appointments",history:"Appointment history",schedules:"Doctor schedules",manage:"Manage doctors"};
  $("#pageTitle").textContent=titles[view]||"CarePoint";
  renderAll(); window.scrollTo({top:0,behavior:"smooth"});
}
$$(".nav-btn").forEach(b=>b.addEventListener("click",()=>go(b.dataset.view)));
document.addEventListener("click",e=>{const b=e.target.closest("[data-go]");if(b)go(b.dataset.go)});
function updateUserUI(){
 const name=currentUser?.name||"Guest patient";
 $("#sideName").textContent=name;$("#sideRole").textContent=currentUser?"Patient account":"Not signed in";
 $("#sideAvatar").textContent=currentUser?initials(name):"G";
 $("#authBtn").textContent=currentUser?"My account":"Sign in / Register";
 $("#logoutBtn").style.visibility=currentUser?"visible":"hidden";
 $("#pageTitle").textContent=currentUser?`Welcome back, ${name.split(" ")[0]}`:"Good day";
}
function showAuth(tab="login"){
 openModal(`<h2 id="modalTitle">Welcome to CarePoint</h2><p class="modal-sub">Sign in to manage your appointments, or create a patient account.</p>
 <div class="modal-tabs"><button type="button" class="${tab==="login"?"active":""}" data-auth-tab="login">Sign in</button><button type="button" class="${tab==="register"?"active":""}" data-auth-tab="register">Register</button></div><div id="authForm"></div>`);
 renderAuthForm(tab);
 $$("[data-auth-tab]").forEach(b=>b.addEventListener("click",()=>{ $$("[data-auth-tab]").forEach(x=>x.classList.toggle("active",x===b));renderAuthForm(b.dataset.authTab)}));
}
function renderAuthForm(tab){
 $("#authForm").innerHTML=tab==="login"?`<form id="loginForm"><div class="field"><label>Email address</label><input name="email" type="email" required placeholder="you@example.com"></div><div class="field"><label>Password</label><input name="password" type="password" required placeholder="Your password"></div><button class="btn btn-primary modal-submit">Sign in</button><p class="form-note">This demo stores account details only in this browser. Do not use a real password.</p></form>`:
 `<form id="registerForm"><div class="form-grid"><div class="field"><label>Full name</label><input name="name" required placeholder="Your full name"></div><div class="field"><label>Phone number</label><input name="phone" required placeholder="Mobile number"></div><div class="field full"><label>Email address</label><input name="email" type="email" required placeholder="you@example.com"></div><div class="field full"><label>Password</label><input name="password" type="password" minlength="4" required placeholder="At least 4 characters"></div></div><button class="btn btn-primary modal-submit">Create patient account</button><p class="form-note">Demo only: account information is stored locally in this browser.</p></form>`;
 $("#loginForm")?.addEventListener("submit",e=>{e.preventDefault();const f=new FormData(e.currentTarget);const users=load("cp_users",[]);const u=users.find(x=>x.email.toLowerCase()===f.get("email").toLowerCase()&&x.password===f.get("password"));if(!u){toast("Account not found. Please register first.");return}currentUser={name:u.name,email:u.email,phone:u.phone};save();closeModal();updateUserUI();renderAll();toast("Signed in successfully")});
 $("#registerForm")?.addEventListener("submit",e=>{e.preventDefault();const f=new FormData(e.currentTarget);const users=load("cp_users",[]);const email=f.get("email").trim().toLowerCase();if(users.some(u=>u.email.toLowerCase()===email)){toast("An account with this email already exists.");return}const u={name:f.get("name").trim(),phone:f.get("phone").trim(),email,password:f.get("password")};users.push(u);localStorage.setItem("cp_users",JSON.stringify(users));currentUser={name:u.name,email:u.email,phone:u.phone};save();closeModal();updateUserUI();renderAll();toast("Your account has been created")});
}
$("#authBtn").addEventListener("click",()=>currentUser?openAccount():showAuth());
function openAccount(){openModal(`<h2>My patient account</h2><p class="modal-sub">Your profile details saved in this browser.</p><div class="field"><label>Full name</label><input value="${esc(currentUser.name)}" disabled></div><div class="field"><label>Email</label><input value="${esc(currentUser.email)}" disabled></div><div class="field"><label>Phone</label><input value="${esc(currentUser.phone||"Not provided")}" disabled></div><button class="btn btn-outline modal-submit" id="accountClose">Close</button>`);$("#accountClose").onclick=closeModal}
$("#logoutBtn").addEventListener("click",()=>{if(!currentUser)return;currentUser=null;save();updateUserUI();renderAll();toast("You have signed out")});
function renderDoctors(){
 const search=($("#doctorSearch")?.value||"").toLowerCase(), spec=$("#specialtyFilter")?.value||"";
 const specs=[...new Set(doctors.map(d=>d.specialty))].sort();const select=$("#specialtyFilter");const old=select.value;select.innerHTML='<option value="">All specialties</option>'+specs.map(s=>`<option>${esc(s)}</option>`).join("");select.value=specs.includes(old)?old:"";
 const list=doctors.filter(d=>(d.name+" "+d.specialty).toLowerCase().includes(search)&&(!spec||d.specialty===spec));
 $("#doctorGrid").innerHTML=list.length?list.map(d=>`<article class="doctor-card"><div class="doctor-top"><div class="doctor-avatar">${esc(initials(d.name))}</div><div><h3>${esc(d.name)}</h3><div class="specialty">${esc(d.specialty)}</div></div></div><div class="doctor-meta"><span>♧ ${esc(d.experience)}</span><span>₹${Number(d.fee).toLocaleString("en-IN")} / visit</span></div><div class="card-actions"><span class="muted">By appointment</span><button class="small-btn" data-book="${d.id}">View & book →</button></div></article>`).join(""):`<div class="empty-state"><b>No doctors found</b>Try a different name or specialty.</div>`;
 $$("[data-book]").forEach(b=>b.onclick=()=>bookingModal(Number(b.dataset.book)));
}
$("#doctorSearch").addEventListener("input",renderDoctors);$("#specialtyFilter").addEventListener("change",renderDoctors);
function bookingModal(id){
 const d=doctors.find(x=>x.id===id);if(!d)return;
 const min=isoToday;
 openModal(`<h2>Book an appointment</h2><p class="modal-sub">${esc(d.name)} · ${esc(d.specialty)} · Consultation fee ₹${d.fee}</p>
 <form id="bookingForm"><div class="field"><label>Appointment date</label><input name="date" type="date" min="${min}" required></div><div class="field"><label>Available time</label><select name="time" required disabled><option value="">Select a date first</option></select></div><div class="field"><label>Reason for visit (optional)</label><textarea name="reason" placeholder="Briefly describe your concern"></textarea></div><button class="btn btn-primary modal-submit">Confirm appointment</button><p class="form-note">You must be signed in. A time slot can only be booked once.</p></form>`);
 const form=$("#bookingForm"), date=form.elements.date, time=form.elements.time;
 date.addEventListener("change",()=>{const day=weekday(date.value);const available=d.days.includes(day);const taken=bookings.filter(b=>b.doctorId===d.id&&b.date===date.value&&b.status!=="Cancelled").map(b=>b.time);const slots=available?d.slots.filter(s=>!taken.includes(s)):[];time.disabled=!slots.length;time.innerHTML=slots.length?'<option value="">Choose a time</option>'+slots.map(s=>`<option value="${s}">${prettyTime(s)}</option>`).join(""):`<option value="">${available?"No slots left":"Doctor is not available on this day"}</option>`});
 form.addEventListener("submit",e=>{e.preventDefault();if(!currentUser){closeModal();showAuth("login");toast("Please sign in to book an appointment");return}const dateVal=date.value,timeVal=time.value;if(!d.days.includes(weekday(dateVal))){toast("Doctor is not available on this day");return}if(bookings.some(b=>b.doctorId===d.id&&b.date===dateVal&&b.time===timeVal&&b.status!=="Cancelled")){toast("That time slot has already been booked");date.dispatchEvent(new Event("change"));return}bookings.push({id:Date.now(),doctorId:d.id,doctorName:d.name,specialty:d.specialty,patientEmail:currentUser.email,patientName:currentUser.name,date:dateVal,time:timeVal,reason:form.elements.reason.value,status:"Upcoming",createdAt:new Date().toISOString()});save();closeModal();go("appointments");toast("Appointment confirmed")});
}
function appointmentCard(b,showCancel=false){
 const d=new Date(b.date+"T12:00:00");const status=b.status.toLowerCase();
 return `<article class="appointment-card"><div class="date-box"><b>${d.getDate()}</b><small>${d.toLocaleDateString("en-US",{month:"short"}).toUpperCase()}</small></div><div class="appointment-info"><h3>${esc(b.doctorName)}</h3><p>${esc(b.specialty)} · ${fmtDate(b.date)} at ${prettyTime(b.time)}</p></div><span class="status ${status}">${esc(b.status)}</span><div class="appointment-actions">${showCancel?`<button class="small-btn" data-cancel="${b.id}">Cancel booking</button>`:""}</div></article>`;
}
function bindCancel(){ $$("[data-cancel]").forEach(btn=>btn.onclick=()=>{const b=bookings.find(x=>x.id===Number(btn.dataset.cancel));if(!b)return;if(!confirm("Cancel this appointment?"))return;b.status="Cancelled";save();renderAll();toast("Appointment cancelled")})}
function renderAppointments(){
 const list=patientBookings().filter(b=>b.status==="Upcoming"&&b.date>=isoToday).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
 $("#appointmentsList").innerHTML=list.length?list.map(b=>appointmentCard(b,true)).join(""):`<div class="empty-state"><b>No upcoming appointments</b>You have no active bookings. Find a doctor to book your first visit.</div>`;
 bindCancel();
}
function renderHistory(){
 const q=($("#historySearch")?.value||"").toLowerCase(),filter=$("#historyFilter")?.value||"";
 const list=patientBookings().filter(b=>b.status!=="Upcoming"||b.date<isoToday).filter(b=>(b.doctorName+" "+b.specialty).toLowerCase().includes(q)&&(!filter||b.status===filter)).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
 $("#historyList").innerHTML=list.length?list.map(b=>appointmentCard(b)).join(""):`<div class="empty-state"><b>No history to show</b>Completed and cancelled appointments will appear here.</div>`;
}
$("#historySearch").addEventListener("input",renderHistory);$("#historyFilter").addEventListener("change",renderHistory);
function renderSchedules(){
 const q=($("#scheduleSearch")?.value||"").toLowerCase();
 const list=doctors.filter(d=>d.name.toLowerCase().includes(q));
 $("#scheduleList").innerHTML=list.length?list.map(d=>`<article class="schedule-card"><div class="schedule-head"><div class="doctor-top"><div class="doctor-avatar">${esc(initials(d.name))}</div><div><h3>${esc(d.name)}</h3><p>${esc(d.specialty)}</p></div></div><span class="status">Available</span></div><div class="day-chips">${d.days.map(day=>`<span class="day-chip">${day}</span>`).join("")}</div><div class="slot-row">${d.slots.map(t=>`<span class="slot-chip">${prettyTime(t)}</span>`).join("")}</div></article>`).join(""):`<div class="empty-state"><b>No schedules found</b></div>`;
}
$("#scheduleSearch").addEventListener("input",renderSchedules);
function renderManage(){
 $("#manageDoctorList").innerHTML=doctors.length?doctors.map(d=>`<div class="manage-row"><div class="doctor-avatar">${esc(initials(d.name))}</div><div class="manage-copy"><strong>${esc(d.name)}</strong><small>${esc(d.specialty)} · ₹${d.fee} · ${d.days.length} working days</small></div><button class="small-btn" data-edit="${d.id}">Edit</button><button class="small-btn" data-remove="${d.id}">Remove</button></div>`).join(""):`<div class="empty-state"><b>No doctors added</b>Add a doctor to make them available for booking.</div>`;
 $$("[data-edit]").forEach(b=>b.onclick=()=>doctorForm(Number(b.dataset.edit)));
 $$("[data-remove]").forEach(b=>b.onclick=()=>{const id=Number(b.dataset.remove);if(!confirm("Remove this doctor from the directory? Existing appointments will remain in history."))return;doctors=doctors.filter(d=>d.id!==id);save();renderAll();toast("Doctor removed")});
}
const dayNames=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
function doctorForm(id=null){
 const d=id?doctors.find(x=>x.id===id):{name:"",specialty:"",experience:"",fee:"",days:[],slots:[]};if(!d)return;
 openModal(`<h2>${id?"Edit doctor":"Add a doctor"}</h2><p class="modal-sub">Enter the doctor's profile and weekly availability.</p><form id="doctorForm"><div class="form-grid"><div class="field full"><label>Doctor name</label><input name="name" required value="${esc(d.name)}" placeholder="Dr. Full Name"></div><div class="field"><label>Specialty</label><input name="specialty" required value="${esc(d.specialty)}" placeholder="e.g. Cardiology"></div><div class="field"><label>Experience</label><input name="experience" required value="${esc(d.experience)}" placeholder="e.g. 5 years"></div><div class="field"><label>Consultation fee (₹)</label><input name="fee" type="number" min="0" required value="${esc(d.fee)}"></div><div class="field"><label>Available days</label><select name="days" multiple size="4" style="height:auto;padding:6px">${dayNames.map(day=>`<option value="${day}" ${d.days.includes(day)?"selected":""}>${day}</option>`).join("")}</select></div><div class="field full"><label>Time slots (24-hour format, comma separated)</label><input name="slots" value="${esc(d.slots.join(", "))}" required placeholder="09:00, 10:30, 14:00"></div></div><button class="btn btn-primary modal-submit">${id?"Save changes":"Add doctor"}</button></form>`);
 $("#doctorForm").addEventListener("submit",e=>{e.preventDefault();const f=new FormData(e.currentTarget);const days=[...e.currentTarget.elements.days.selectedOptions].map(o=>o.value);const slots=f.get("slots").split(",").map(s=>s.trim()).filter(s=>/^([01]\d|2[0-3]):[0-5]\d$/.test(s));if(!days.length||!slots.length){toast("Choose at least one day and one valid time slot");return}const obj={id:id||nextDoctorId++,name:f.get("name").trim(),specialty:f.get("specialty").trim(),experience:f.get("experience").trim(),fee:Number(f.get("fee")),days,slots:[...new Set(slots)].sort()};if(id)doctors=doctors.map(x=>x.id===id?obj:x);else doctors.push(obj);save();closeModal();renderAll();toast(id?"Doctor profile updated":"Doctor added successfully")});
}
$("#addDoctorBtn").addEventListener("click",()=>doctorForm());
function renderDashboard(){
 const list=patientBookings();const upcoming=list.filter(b=>b.status==="Upcoming"&&b.date>=isoToday);const completed=list.filter(b=>b.status==="Completed");
 $("#upcomingCount").textContent=upcoming.length;$("#completedCount").textContent=completed.length;$("#doctorCount").textContent=doctors.length;
 const sorted=upcoming.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,3);
 $("#dashboardAppointments").innerHTML=sorted.length?sorted.map(b=>appointmentCard(b,true)).join(""):`<div class="empty-state"><b>Nothing scheduled yet</b>Your upcoming appointments will appear here once you book a visit.<br><br><button class="small-btn" data-go="doctors">Find a doctor</button></div>`;
 bindCancel();
}
function renderAll(){bookings.forEach(b=>{if(b.status==="Upcoming" && b.date<isoToday)b.status="Completed"});save();updateUserUI();renderDashboard();renderDoctors();renderAppointments();renderHistory();renderSchedules();renderManage()}
$("#addDoctorBtn").addEventListener("click",()=>doctorForm());
$("#todayLabel").textContent="CAREPOINT / PATIENT PORTAL · "+today.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"}).toUpperCase();
renderAll();
