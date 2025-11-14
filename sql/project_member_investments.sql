-- Phase 2: Enhanced Investment Distribution System
-- Update project_investments to track investment percentage

-- Add investment_percentage column (auto-calculated via trigger)
ALTER TABLE public.project_investments 
ADD COLUMN IF NOT EXISTS investment_percentage DECIMAL(5, 2) DEFAULT 0;

-- Function to calculate investment percentages for a project
CREATE OR REPLACE FUNCTION calculate_investment_percentages(p_project_id BIGINT)
RETURNS void AS $$
DECLARE
  total_investment DECIMAL(12, 2);
BEGIN
  -- Calculate total investment for the project
  SELECT COALESCE(SUM(amount), 0) INTO total_investment
  FROM project_investments
  WHERE project_id = p_project_id;
  
  -- Update percentages for all investments in this project
  IF total_investment > 0 THEN
    UPDATE project_investments
    SET investment_percentage = (amount / total_investment) * 100
    WHERE project_id = p_project_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate percentages when investment is added/updated
CREATE OR REPLACE FUNCTION update_investment_percentages()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate percentages for the affected project
  PERFORM calculate_investment_percentages(NEW.project_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT
DROP TRIGGER IF EXISTS trigger_investment_insert ON public.project_investments;
CREATE TRIGGER trigger_investment_insert
  AFTER INSERT ON public.project_investments
  FOR EACH ROW
  EXECUTE FUNCTION update_investment_percentages();

-- Create trigger for UPDATE
DROP TRIGGER IF EXISTS trigger_investment_update ON public.project_investments;
CREATE TRIGGER trigger_investment_update
  AFTER UPDATE ON public.project_investments
  FOR EACH ROW
  WHEN (OLD.amount IS DISTINCT FROM NEW.amount)
  EXECUTE FUNCTION update_investment_percentages();

-- Create trigger for DELETE to recalculate remaining investments
CREATE OR REPLACE FUNCTION update_investment_percentages_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_investment_percentages(OLD.project_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_investment_delete ON public.project_investments;
CREATE TRIGGER trigger_investment_delete
  AFTER DELETE ON public.project_investments
  FOR EACH ROW
  EXECUTE FUNCTION update_investment_percentages_on_delete();

-- Recalculate percentages for all existing projects
DO $$
DECLARE
  proj_id BIGINT;
BEGIN
  FOR proj_id IN SELECT DISTINCT project_id FROM project_investments
  LOOP
    PERFORM calculate_investment_percentages(proj_id);
  END LOOP;
END $$;
