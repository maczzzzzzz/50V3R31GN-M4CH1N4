use image::{DynamicImage, GrayImage};
use imageproc::edges::canny;
use imageproc::hough::{detect_lines as hough_detect, LineDetectionOptions, PolarLine};
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct FoundryWall {
    pub c: [f32; 4],
}

pub fn detect_edges(img: &DynamicImage) -> GrayImage {
    let gray_img = img.to_luma8();
    canny(&gray_img, 50.0, 100.0)
}

pub fn detect_lines(edges: &GrayImage) -> Vec<FoundryWall> {
    let options = LineDetectionOptions {
        vote_threshold: 100,
        suppression_radius: 8,
    };
    
    let polar_lines = hough_detect(edges, options);
    let (width, height) = edges.dimensions();
    
    polar_lines.into_iter()
        .filter_map(|line| polar_to_foundry_wall(line, width, height))
        .collect()
}

fn polar_to_foundry_wall(line: PolarLine, width: u32, height: u32) -> Option<FoundryWall> {
    let r = line.r;
    let theta = line.angle_in_degrees as f32 * std::f32::consts::PI / 180.0;
    let cos_theta = theta.cos();
    let sin_theta = theta.sin();

    let mut points = Vec::new();

    // Intersection with x = 0
    if sin_theta.abs() > 1e-6 {
        let y = r / sin_theta;
        if y >= 0.0 && y <= height as f32 {
            points.push((0.0, y));
        }
    }

    // Intersection with x = width
    if sin_theta.abs() > 1e-6 {
        let y = (r - width as f32 * cos_theta) / sin_theta;
        if y >= 0.0 && y <= height as f32 {
            points.push((width as f32, y));
        }
    }

    // Intersection with y = 0
    if cos_theta.abs() > 1e-6 {
        let x = r / cos_theta;
        if x >= 0.0 && x <= width as f32 {
            points.push((x, 0.0));
        }
    }

    // Intersection with y = height
    if cos_theta.abs() > 1e-6 {
        let x = (r - height as f32 * sin_theta) / cos_theta;
        if x >= 0.0 && x <= width as f32 {
            points.push((x, height as f32));
        }
    }

    // Sort and deduplicate points to find the two end points of the line segment within the image
    points.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap_or(std::cmp::Ordering::Equal).then(a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal)));
    points.dedup_by(|a, b| (a.0 - b.0).abs() < 1e-3 && (a.1 - b.1).abs() < 1e-3);

    if points.len() >= 2 {
        Some(FoundryWall {
            c: [points[0].0, points[0].1, points[1].0, points[1].1],
        })
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_polar_to_foundry_wall() {
        // Horizontal line at y = 50
        // x*cos(pi/2) + y*sin(pi/2) = 50  => y = 50
        let line = PolarLine { r: 50.0, angle_in_degrees: 90 };
        let wall = polar_to_foundry_wall(line, 100, 100).unwrap();
        assert!((wall.c[1] - 50.0).abs() < 1e-3);
        assert!((wall.c[3] - 50.0).abs() < 1e-3);
        assert!((wall.c[0] - 0.0).abs() < 1e-3);
        assert!((wall.c[2] - 100.0).abs() < 1e-3);
    }
}
