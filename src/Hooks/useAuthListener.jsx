import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { logout, setUser, setAuthLoading } from "../Redux/Slice/AuthSlice";
import { auth, db } from "../Config/Firebaseconfig";
import { useNavigate } from "react-router";

export const useAuthListener = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    });
  }, []);

  useEffect(() => {
    dispatch(setAuthLoading(true));

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          dispatch(logout());
          return;
        }

        const userDocRef = doc(db, "user", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          dispatch(setUser({ uid: user.uid, role: userData.role }));
          return;
        }

        // Method 2: Fallback to Query (Searching inside the document fields)
        const q = query(collection(db, "user"), where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          dispatch(setUser({ uid: user.uid, role: userData.role }));
        } else {
          console.error("CRITICAL: No Firestore document found for UID:", user.uid);
          // If no data exists in DB, we must log them out of Auth too
          dispatch(logout());
        }
      } catch (err) {
        console.error("Auth Listener Error:", err);
        dispatch(logout());
      } finally {
        dispatch(setAuthLoading(false));
      }
    });

    return () => unsubscribe();
  }, [dispatch]);
};