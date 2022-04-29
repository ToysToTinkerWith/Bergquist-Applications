import React, { useEffect, useState } from "react"
import { auth } from "./FirebaseInit"
import { onAuthStateChanged } from "firebase/auth"

export const AuthContext = React.createContext()

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState({
    userProviderId: "",
    userId: "",
    userName: "",
    userEmail: "",
    userPhotoLink: "",
  })

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        const requiredData = {
          userId: user.uid,
          userName: user.displayName,
          userEmail: user.email,
          userPhotoLink: user.photoURL,
        }

        setUserData(requiredData)
        setCurrentUser(user)
      } else {
        setCurrentUser(null)
      }
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <></>
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}