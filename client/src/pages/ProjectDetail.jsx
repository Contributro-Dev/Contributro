import { useParams } from 'react-router-dom'
import { useEffect, useContext, useState, useRef } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { getProject, joinProject } from "../services/projectServices.js";
import Sidebar from "../components/Sidebar.jsx";
import { useNavigate } from 'react-router-dom'
import "./ProjectDetail.css";

function ProjectDetail() {
  return (
    <div>
      <h1>Hello</h1>
    </div>  
  )
}

export default ProjectDetail;