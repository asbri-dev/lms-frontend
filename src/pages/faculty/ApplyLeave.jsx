import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import DatePicker from "react-datepicker";
import { format, differenceInCalendarDays, addDays } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import "./ApplyLeave.css";

const ApplyLeave = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [typeOfLeave, setTypeOfLeave] = useState("Casual Leaves");
  const [leaveFrom, setLeaveFrom] = useState(null);
  const [leaveTo, setLeaveTo] = useState(null);
  const [reasonForLeave, setReasonForLeave] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // 🔢 Calculate number of days
  const noOfDays =
    leaveFrom && leaveTo
      ? differenceInCalendarDays(leaveTo, leaveFrom) + 1
      : 0;
useEffect(() => {
    const fetchDashboardDetails = async () => {
      try {
        setLoading(true);
        setErrors("");

        const response = await fetch(
          `http://localhost:9090/getDashboardDetails?empId=${user.employeeId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load dashboard");
        }

        setDashboardData(data);
      } catch (err) {
        setErrors(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    if (user?.employeeId) {
      fetchDashboardDetails();
    }
  }, [user]);
     

  const validate = () => {
    const newErrors = {};

    if (!leaveFrom) newErrors.leaveFrom = "Start date is required";
    if (!leaveTo) newErrors.leaveTo = "End date is required";

    if (leaveFrom && leaveTo && leaveTo < leaveFrom) {
      newErrors.leaveTo = "End date cannot be before start date";
    }

    if (!reasonForLeave || reasonForLeave.length < 20) {
      newErrors.reasonForLeave =
        "Reason must be at least 20 characters";
    }

    if (!emergencyContact) {
      newErrors.emergencyContact = "Emergency contact is required";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const response = await fetch(
        "http://localhost:9090/applyLeaves",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            empId: user.employeeId,
            typeOfLeave,
            adminEmpId: user.adminId,
            noOfDays: String(noOfDays),
            leaveFrom: format(leaveFrom, "dd-MMM-yyyy"),
            leaveTo: format(leaveTo, "dd-MMM-yyyy"),
            leaveApplied: format(new Date(), "dd-MMM-yyyy"),
            reasonForLeave,
            emergencyContact,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to apply leave");
      }

      alert("Leave applied successfully!");
      navigate("/faculty/dashboard");

    } catch (error) {
      setErrors({ api: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="apply-container">
      <div className="apply-card">
        <h2>Apply Leave</h2>
        <p>{user.adminId}</p>

        {errors.api && <p className="error">{errors.api}</p>}

        <form onSubmit={handleSubmit}>

          {/* Leave Type */}
          <div className="form-group">
            <label>Leave Type</label>
            <select
              value={typeOfLeave}
              onChange={(e) => setTypeOfLeave(e.target.value)}
            >
              <option value="Casual Leaves">
                Casual Leave ({dashboardData?.casualLeaves || 0})
              </option>
              <option value="Medical Leaves">
                Medical Leave ({dashboardData?.medicalLeaves || 0})
              </option>
            </select>
          </div>

          {/* Start Date */}
          <div className="form-group">
            <label>Start Date</label>
<DatePicker
  selected={leaveFrom}
  onChange={(date) => setLeaveFrom(date)}
  dateFormat="dd-MMM-yyyy"
/>

            {errors.leaveFrom && (
              <span className="error">{errors.leaveFrom}</span>
            )}
          </div>

          {/* End Date */}
          <div className="form-group">
            <label>End Date</label>
            <DatePicker
              selected={leaveTo}
              onChange={(date) => setLeaveTo(date)}
              dateFormat="dd-MMM-yyyy"
              minDate={leaveFrom}
              maxDate={addDays(leaveFrom, 2)}
              
            />
            {errors.leaveTo && (
              <span className="error">{errors.leaveTo}</span>
            )}
          </div>

          {/* Auto Calculated Days */}
          <div className="form-group">
            <label>Total Leave Days</label>
            <input type="text" value={noOfDays} readOnly />
          </div>

          {/* Reason */}
          <div className="form-group">
            <label>Reason</label>
            <textarea
              value={reasonForLeave}
              onChange={(e) => setReasonForLeave(e.target.value)}
              placeholder="Enter detailed reason"
            />
            {errors.reasonForLeave && (
              <span className="error">
                {errors.reasonForLeave}
              </span>
            )}
          </div>

          {/* Emergency Contact */}
          <div className="form-group">
            <label>Emergency Contact</label>
            <input
              type="text"
              value={emergencyContact}
              onChange={(e) =>
                setEmergencyContact(e.target.value)
              }
            />
            {errors.emergencyContact && (
              <span className="error">
                {errors.emergencyContact}
              </span>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? "Submitting..." : "Apply Leave"}
          </button>

        </form>
      </div>
    </div>
  );
};

export default ApplyLeave;
