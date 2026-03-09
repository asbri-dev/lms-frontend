import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/* ================= REUSABLE FIELD (OUTSIDE COMPONENT) ================= */
const Field = ({ label, value }) => (
  <div>
    <p className="text-gray-500 text-xs">{label}</p>
    <p className="font-medium text-gray-800 break-words">
      {value || "-"}
    </p>
  </div>
);

/* ================= MAIN COMPONENT ================= */
const ProfileDetails = ({ profileData }) => {
  const [activeTab, setActiveTab] = useState("personal");
  const [showAadhar, setShowAadhar] = useState(false);
  const [showPan, setShowPan] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  const personal = profileData?.personalDetails || {};
  const address = profileData?.addressDetails || {};
  const bank = profileData?.bankDetails || {};
  const contact = profileData?.contactDetails || {};
  const education = profileData?.educationDetails || {};

  /* 🔒 Mask Function */
  const mask = (value, visible) => {
    if (!value) return "-";
    if (visible) return value;
    if (value.length <= 4) return "****";
    return value.slice(0, 2) + "******" + value.slice(-2);
  };

  return (
    <div className="w-full">

      {/* ================= TABS ================= */}
      <div className="flex gap-2 border-b mb-6 overflow-x-auto">
        {["personal", "address", "bank", "contact", "education"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-300 ${
              activeTab === tab
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ================= CONTENT ================= */}
      <div className="max-h-[500px] overflow-y-auto pr-2 transition-all duration-300">

        {/* PERSONAL */}
        {activeTab === "personal" && (
          <div className="grid grid-cols-2 gap-6 text-sm animate-fadeIn">
            <Field label="Employee ID" value={personal.empId} />
            <Field label="Full Name" value={`${personal.firstName} ${personal.lastName}`} />
            <Field label="Gender" value={personal.gender} />
            <Field label="Date of Birth" value={personal.dateOfBirth} />
            <Field label="Blood Group" value={personal.bloodGroup} />
            <Field label="Marital Status" value={personal.martialStatus} />
            <Field label="Marriage Date" value={personal.marriageDate} />
            <Field label="Mobile" value={personal.mobileNumber} />
            <Field label="Email" value={personal.email} />
            <Field label="Alternate Email" value={personal.alternateEmail} />
            <Field label="Department" value={personal.facultyDept} />
            <Field label="Designation" value={personal.designation} />
            <Field label="Reporting Manager" value={personal.reportingManager} />
            <Field label="Joining Date" value={personal.dateOfJoining} />
            <Field label="Employee Status" value={personal.employeeStatus} />
            <Field label="Probation Period (Months)" value={personal.probationPeriod} />
            <Field label="Notice Period (Months)" value={personal.noticePeriod} />
            <Field label="BGV Completed On" value={personal.bgvCompletedOn} />
            <Field label="Salary Payment Mode" value={personal.salaryPaymentMode} />

            {/* Masked Aadhar */}
            <div>
              <p className="text-gray-500 text-xs">Aadhar Number</p>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {mask(personal.aadharNumber, showAadhar)}
                </span>
                <button
                  onClick={() => setShowAadhar(!showAadhar)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showAadhar ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Masked PAN */}
            <div>
              <p className="text-gray-500 text-xs">PAN Number</p>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {mask(personal.panNumber, showPan)}
                </span>
                <button
                  onClick={() => setShowPan(!showPan)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showPan ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADDRESS */}
        {activeTab === "address" && (
          <div className="grid grid-cols-2 gap-6 text-sm animate-fadeIn">
            <Field label="Nationality" value={address.nationality} />
            <Field label="Current State" value={address.currentState} />
            <Field label="Current District" value={address.currentDistrict} />
            <Field label="Current City" value={address.currentCity} />
            <Field label="Postal Code" value={address.postalCode} />
            <Field label="Street" value={address.streetAreaHno} />
            <Field label="Permanent State" value={address.permanentState} />
            <Field label="Permanent District" value={address.permanentDistrict} />
            <Field label="Permanent City" value={address.permanentCity} />
            <Field label="Permanent Postal Code" value={address.permanentPostalCode} />
            <Field label="Permanent Street" value={address.permanentStreetAreaHno} />
          </div>
        )}

        {/* BANK */}
        {activeTab === "bank" && (
          <div className="grid grid-cols-2 gap-6 text-sm animate-fadeIn">
            <Field label="Name As Per Bank" value={bank.nameAsPerBankRecords} />
            <Field label="Bank Name" value={bank.bankName} />
            <Field label="Bank Branch" value={bank.bankBranch} />

            <div>
              <p className="text-gray-500 text-xs">Account Number</p>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {mask(bank.accountNumber, showAccount)}
                </span>
                <button
                  onClick={() => setShowAccount(!showAccount)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showAccount ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Field label="IFSC Code" value={bank.ifscCode} />
            <Field label="Account Type" value={bank.typeOfAccount} />
            <Field label="Eligible For PF" value={bank.eligibleForPf ? "Yes" : "No"} />
            <Field label="PF Number" value={bank.pfNumber} />
            <Field label="PF Scheme" value={bank.pfScheme} />
            <Field label="PF Joining Date" value={bank.pfJoiningDate} />
            <Field label="UAN Number" value={bank.universalAccountNumber} />
          </div>
        )}

        {/* CONTACT */}
        {activeTab === "contact" && (
          <div className="grid grid-cols-2 gap-6 text-sm animate-fadeIn">
            <Field label="Father Name" value={contact.fatherName} />
            <Field label="Mother Name" value={contact.motherName} />
            <Field label="Spouse Name" value={contact.spouseName} />
            <Field label="Emergency Contact Name" value={contact.emergencyContactName} />
            <Field label="Emergency Relation" value={contact.emergencyContactRelation} />
            <Field label="Emergency Mobile" value={contact.emergencyContactMobileNumber} />
            <Field label="Emergency Email" value={contact.emergencyContactEmail} />
            <Field label="Nearest Railway Station" value={contact.nearByRailWayStation} />
            <Field label="Nearest Post Office" value={contact.nearByPostOffice} />
            <Field label="Post Office Pin Code" value={contact.postOfficePinCode} />
          </div>
        )}

        {/* EDUCATION */}
        {activeTab === "education" && (
          <div className="grid grid-cols-2 gap-6 text-sm animate-fadeIn">
            <Field label="Highest Qualification" value={education.highestQualification} />
            <Field label="UG Course" value={education.ugCourse} />
            <Field label="UG Specialization" value={education.ugSpecialization} />
            <Field label="UG College" value={education.ugCollegeName} />
            <Field label="UG University" value={education.ugUniversityName} />
            <Field label="UG Start Date" value={education.ugStartDate} />
            <Field label="UG End Date" value={education.ugEndDate} />
            <Field label="PG Course" value={education.pgCourse} />
            <Field label="PG Specialization" value={education.pgSpecialization} />
            <Field label="PG College" value={education.pgCollegeName} />
            <Field label="PG University" value={education.pgUniversityName} />
            <Field label="PG Start Date" value={education.pgStartDate} />
            <Field label="PG End Date" value={education.pgEndDate} />
            <Field label="PhD College" value={education.phDCollegeName} />
            <Field label="PhD University" value={education.phDUniversityName} />
            <Field label="PhD Specialization" value={education.phDSpecialization} />
            <Field label="PhD Status" value={education.phDStatus} />
          </div>
        )}

      </div>
    </div>
  );
};

export default ProfileDetails;