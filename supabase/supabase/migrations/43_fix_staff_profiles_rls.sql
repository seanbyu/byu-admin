-- Allow Admins and Managers to update staff profiles in their salon
CREATE POLICY "Admins and Managers can update staff profiles in their salon"
  ON staff_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users AS acting_user
      WHERE acting_user.id = auth.uid()
      AND acting_user.role IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
      AND acting_user.salon_id = (
        SELECT target_user.salon_id FROM users AS target_user
        WHERE target_user.id = staff_profiles.user_id
      )
    )
  );

-- Allow Admins and Managers to insert staff profiles for users in their salon
CREATE POLICY "Admins and Managers can insert staff profiles"
  ON staff_profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users AS acting_user
      WHERE acting_user.id = auth.uid()
      AND acting_user.role IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
      AND acting_user.salon_id = (
        SELECT target_user.salon_id FROM users AS target_user
        WHERE target_user.id = staff_profiles.user_id
      )
    )
  );
